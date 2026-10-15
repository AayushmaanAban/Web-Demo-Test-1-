#!/usr/bin/env python3
"""
Builds assets/js/products.js for the MOON x Satoshi demo directly from the
Shopify product export, so titles, prices, variants, metafields and image
order are never hand-typed.

Usage:  python3 tools/build-products.py
"""
import csv
import json
import os
import re

SRC = "/Users/aayushmaanbuckshee/Downloads/products_export_1 (1).csv"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets/js/products.js")

COLLECTION_BY_TYPE = {
    "bottoms": {"id": "bottoms", "title": "Bottoms"},
    "shirt": {"id": "tops", "title": "Tops"},
    "caps": {"id": "caps", "title": "Caps"},
}
EXTRA_COLLECTIONS = {
    "wild": [{"id": "wild", "title": "WILD"}],
}

# Merchandising copy that beats what the export carries, keyed by handle. The
# Shopify body copy leans on one boilerplate paragraph (fabric weight, "crafted
# by a master tailor") that reads the same on every surface; these replace it
# with the label's own words — and survive `python3 tools/build-products.py`,
# which would otherwise overwrite assets/js/products.js with the export again.
BODY_OVERRIDES = {
    "boot-leg-72": (
        "<p>Boot Leg \u201972 is hand-stitched, not just hand-finished. One master tailor, "
        "fifty years at the table, runs every side seam on a single needle, bar-tacks each "
        "belt loop by hand, and turns the hems so both legs break at the same point. The rise "
        "sits on the hip rather than the waist \u2014 which is why the flare swings when you "
        "walk instead of standing out like a cone.</p>"
        "<p>250 GSM dark indigo denim that softens from the first wear. The handwork shows up "
        "in the parts nobody photographs: eased rather than stretched at the fly, a waistband "
        "pressed twice before it is closed, pocket bags cut from the same bolt.</p>"
    ),
}


def clean_html(raw):
    """Keep the merchandising HTML but drop the empty/duplicate wrappers."""
    if not raw:
        return ""
    raw = raw.replace("\r\n", "\n").strip()
    raw = re.sub(r"<div>\s*<br\s*/?>\s*</div>", "", raw)
    raw = re.sub(r"<br\s*/?>\s*</p>\s*</div>", "</p></div>", raw)
    raw = re.sub(r"<div>\s*<span>", "<li><span>", raw)
    raw = re.sub(r"</span>\s*</div>", "</span></li>", raw)
    raw = re.sub(r"<\s*</", "</", raw)
    return raw.strip()


def normalize_size(size):
    """The export mixes 's' and 'S'; present short sizes consistently."""
    if size and len(size) <= 2 and size.isalpha():
        return size.upper()
    if size and size.lower() == "one size":
        return "One Size"
    return size


def split_list(value):
    if not value:
        return []
    return [p.strip() for p in value.split(";") if p.strip()]


def money(price):
    return int(round(float(price))) if price else 0


def main():
    with open(SRC, encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))

    products = {}
    order = []

    for row in rows:
        handle = (row.get("Handle") or "").strip()
        if not handle:
            continue
        if handle not in products:
            order.append(handle)
            products[handle] = {
                "handle": handle,
                "title": (row.get("Title") or "").strip(),
                "body": clean_html(row.get("Body (HTML)") or ""),
                "vendor": (row.get("Vendor") or "Moonalienlike").strip(),
                "category": (row.get("Product Category") or "").strip(),
                "type": (row.get("Type") or "").strip(),
                "published": (row.get("Published") or "").strip().lower() == "true",
                "status": (row.get("Status") or "").strip(),
                "seo": {
                    "title": (row.get("SEO Title") or "").strip(),
                    "description": (row.get("SEO Description") or "").strip(),
                },
                "option_names": ["", "", ""],
                "options": [],
                "variants": [],
                "images": [],
                "price": 0,
                "metafields": {},
            }
        p = products[handle]

        # ---- option names: only present on the first variant row of an export,
        # so remember them and reuse for the following rows.
        for i in (1, 2, 3):
            name = (row.get(f"Option{i} Name") or "").strip()
            if name and not p["option_names"][i - 1]:
                p["option_names"][i - 1] = name

        values = {i: (row.get(f"Option{i} Value") or "").strip() for i in (1, 2, 3)}
        for i in (1, 2, 3):
            name = p["option_names"][i - 1]
            value = values[i]
            if not name or not value:
                continue
            # a single-variant product exports the placeholder "Default Title"
            if value.lower() == "default title":
                continue
            if name.lower() in ("title", "default"):
                continue
            value = normalize_size(value)
            for opt in p["options"]:
                if opt["name"].lower() == name.lower():
                    if value not in opt["values"]:
                        opt["values"].append(value)
                    break
            else:
                p["options"].append({"name": name, "values": [value]})

        # ---- variant
        price = row.get("Variant Price") or ""
        qty_raw = row.get("Variant Inventory Qty") or ""
        if price:
            qty = int(float(qty_raw)) if str(qty_raw).strip() else None
            variant_color = values[2]
            if not variant_color and values[1].lower() == "default title":
                variant_color = ""
            p["variants"].append({
                "size": normalize_size(values[1]) if values[1] and values[1].lower() != "default title" else "One Size",
                "color": variant_color,
                "price": money(price),
                "qty": qty,
                "available": (qty is None or qty > 0) and (row.get("Status") or "active").strip() == "active",
            })
            p["price"] = max(p["price"], money(price))

        # ---- image
        src = (row.get("Image Src") or "").strip()
        if src:
            pos = int(float(row.get("Image Position") or 0) or 0)
            alt = (row.get("Image Alt Text") or "").strip()
            p["images"].append({"src": src, "position": pos, "alt": alt})

        # ---- metafields (only populated on the first variant row)
        for key, value in row.items():
            if key and "product.metafields.shopify." in key:
                short = key.split("product.metafields.shopify.")[1].rstrip(")")
                if (value or "").strip():
                    p["metafields"][short] = (value or "").strip()

    out = []
    for handle in order:
        p = products[handle]
        if not p["title"] or not p["variants"]:
            continue
        # collapse identical variants created by the export's image-only rows
        unique_variants, seen_variants = [], set()
        for v in p["variants"]:
            key = (v["size"].lower(), v["color"].lower())
            if key in seen_variants:
                continue
            seen_variants.add(key)
            unique_variants.append(v)
        p["variants"] = unique_variants

        # dedupe + order images, strip the cache-busting version param
        seen, imgs = set(), []
        for img in sorted(p["images"], key=lambda i: i["position"]):
            base = img["src"].split("?")[0]
            if base in seen:
                continue
            seen.add(base)
            imgs.append({"src": base + "?width=1400", "alt": img["alt"] or p["title"]})

        mf = p["metafields"]
        collections = []
        coll = COLLECTION_BY_TYPE.get(p["type"].lower())
        if coll:
            collections.append(coll)
        collections += EXTRA_COLLECTIONS.get(handle, [])

        sizes, seen_sizes = [], set()
        for v in p["variants"]:
            if v["size"] and v["size"] not in seen_sizes:
                seen_sizes.add(v["size"])
                sizes.append(v["size"])
        # keep the label's own order: metafield first, then any variant colour
        colors = []
        for c in split_list(mf.get("color-pattern", "")) + [v["color"] for v in p["variants"]]:
            c = c.strip().lower()
            if c and c not in colors:
                colors.append(c)
        fabric = split_list(mf.get("fabric", ""))
        gender = split_list(mf.get("target-gender", ""))
        total_qty = sum(v["qty"] or 0 for v in p["variants"])

        out.append({
            "handle": handle,
            "title": p["title"],
            "body": BODY_OVERRIDES.get(handle, p["body"]),
            "vendor": p["vendor"],
            "type": p["type"],
            "category": p["category"],
            "price": p["price"],
            "collections": collections,
            "options": p["options"],
            "variants": p["variants"],
            "sizes": sizes,
            "colors": colors,
            "fabric": fabric,
            "fit": mf.get("fit", ""),
            "gender": gender,
            "neckline": mf.get("neckline", ""),
            "sleeve": mf.get("sleeve-length-type", ""),
            "rise": mf.get("waist-rise", ""),
            "pants_length": mf.get("pants-length-type", ""),
            "headwear": mf.get("headwear-features", ""),
            "size_label": mf.get("size", ""),
            "inventory": total_qty,
            "sold_out": total_qty == 0,
            "images": imgs,
            "seo": p["seo"],
        })

    js = "/* Auto-generated by tools/build-products.py from the Shopify export. Do not hand-edit. */\n"
    js += "window.MOON_PRODUCTS = " + json.dumps(out, indent=2, ensure_ascii=False) + ";\n"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(js)

    print("wrote %s\n%d products, %d images" % (OUT, len(out), sum(len(p["images"]) for p in out)))
    for p in out:
        print("  - %-20s %-22s Rs%-6s %d imgs  %s" % (
            p["handle"], p["title"], p["price"], len(p["images"]),
            ",".join(c["id"] for c in p["collections"])))


if __name__ == "__main__":
    main()
