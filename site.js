/* ==========================================================================
   MOON — Satoshi theme demo build :: site.js
   Vanilla JS, zero dependencies.

   Injects the shared chrome (demo note, announcement marquee, header, mobile
   nav, search, cart drawer, footer, toasts) so every page stays in sync, then
   renders the page-specific surface: home, collection, product, journal.

   Product data comes from assets/js/products.js, which is generated from the
   Shopify export by tools/build-products.py — nothing is hand-typed.
   ========================================================================== */
(function () {
  "use strict";

  var PRODUCTS = window.MOON_PRODUCTS || [];

  var COLLECTIONS = [
    { id: "all", title: "Catalog" },
    { id: "bottoms", title: "Bottoms" },
    { id: "tops", title: "Tops" },
    { id: "caps", title: "Caps" },
    { id: "wild", title: "WILD" }
  ];

  var NAV = [
    { href: "shop.html", label: "Catalog", id: "all" },
    { href: "shop.html?collection=bottoms", label: "Bottoms", id: "bottoms" },
    { href: "shop.html?collection=tops", label: "Tops", id: "tops" },
    { href: "shop.html?collection=caps", label: "Caps", id: "caps" },
    { href: "shop.html?collection=wild", label: "WILD", id: "wild" },
    { href: "journal.html", label: "Journal" }
  ];

  /* Colour swatches: the brand's palette, with fabric names as fallbacks. */
  var COLOR_HEX = {
    black: "#0c0c0c",
    white: "#f3f0ea",
    navy: "#1b2a4a",
    blue: "#35507e",
    green: "#25492f",
    beige: "#d8cbb4",
    denim: "#2f4062",
    grey: "#8a8a86",
    gray: "#8a8a86",
    brown: "#5b4433",
    animal: "repeating-linear-gradient(45deg,#3a3128 0 3px,#c9b28b 3px 6px)"
  };

  var FREE_SHIP = 2999;
  var CART_KEY = "moon-demo-cart-v1";
  var NOTE_KEY = "moon-demo-note-hidden";

  /* ---------------------------------------------------------------- helpers */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* product copy arrives as merchandising HTML from the export: allow the
     formatting, strip anything executable. */
  function safeBody(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  }

  function money(value) {
    var n = Math.round(Number(value) || 0);
    return "\u20B9" + n.toLocaleString("en-IN");
  }

  /* Shopify CDN accepts a width parameter — keep the demo fast. */
  function imgUrl(src, width) {
    if (!src) return "";
    var base = String(src).split("?")[0];
    return base + "?width=" + (width || 800);
  }

  function srcset(src) {
    /* the studio files run to ~2100px wide, so 2000 keeps 2x displays sharp */
    return [400, 800, 1200, 2000].map(function (w) { return imgUrl(src, w) + " " + w + "w"; }).join(", ");
  }

  function findProduct(handle) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].handle === handle) return PRODUCTS[i];
    }
    return null;
  }

  function inCollection(id) {
    if (!id || id === "all") return PRODUCTS.slice();
    return PRODUCTS.filter(function (p) {
      return p.collections.some(function (c) { return c.id === id; });
    });
  }

  function collectionTitle(id) {
    for (var i = 0; i < COLLECTIONS.length; i++) {
      if (COLLECTIONS[i].id === id) return COLLECTIONS[i].title;
    }
    return id;
  }

  function swatch(color) {
    var key = String(color || "").toLowerCase();
    return COLOR_HEX[key] || "#b9b4aa";
  }

  function pluralise(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

  function initial(name) { return String(name || "").charAt(0).toUpperCase(); }

  function param(key) {
    try { return new URLSearchParams(window.location.search).get(key); }
    catch (err) { return null; }
  }

  /* ------------------------------------------------------------------ icons */
  var ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 19 19 5M9 5h10v10"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 9 6 6 6-6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m5 13 4.5 4.5L19 7"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 7h11v9H2zM13 10h4l4 3v3h-8z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3Z"/></svg>',
    moon: '<svg viewBox="0 0 40 40" fill="none"><path d="M27 4a16 16 0 1 0 9 29.6A18 18 0 0 1 27 4Z" fill="currentColor"/><circle cx="26" cy="19" r="3.4" fill="currentColor" opacity=".55"/><circle cx="31" cy="27" r="1.6" fill="currentColor" opacity=".5"/></svg>'
  };

  /* ------------------------------------------------------------------- cart */
  var cart = (function () {
    var items = [];
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (Array.isArray(raw)) items = raw;
    } catch (err) { items = []; }

    function persist() {
      try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (err) { /* private mode */ }
    }

    return {
      all: function () { return items; },
      count: function () {
        return items.reduce(function (n, i) { return n + i.qty; }, 0);
      },
      subtotal: function () {
        return items.reduce(function (n, i) { return n + i.qty * i.price; }, 0);
      },
      add: function (product, size, color, qty) {
        var key = product.handle + "|" + size + "|" + (color || "");
        var existing = null;
        for (var i = 0; i < items.length; i++) { if (items[i].key === key) existing = items[i]; }
        if (existing) {
          existing.qty += qty || 1;
        } else {
          items.push({
            key: key,
            handle: product.handle,
            title: product.title,
            size: size,
            color: color || "",
            price: product.price,
            image: (product.images[0] || {}).src || "",
            qty: qty || 1
          });
        }
        persist();
      },
      setQty: function (key, qty) {
        items = items.map(function (i) { return i.key === key ? Object.assign({}, i, { qty: Math.max(1, qty) }) : i; });
        persist();
      },
      remove: function (key) {
        items = items.filter(function (i) { return i.key !== key; });
        persist();
      }
    };
  })();

  /* ---------------------------------------------------------------- toasts */
  function toast(message, actionLabel, action) {
    var stack = $(".toast-stack");
    if (!stack) return;
    var node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.innerHTML = "<span>" + esc(message) + "</span>";
    if (actionLabel) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = actionLabel;
      btn.addEventListener("click", function () {
        if (typeof action === "function") action();
        node.remove();
      });
      node.appendChild(btn);
    }
    stack.appendChild(node);
    setTimeout(function () {
      node.style.transition = "opacity .4s ease, transform .4s ease";
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      setTimeout(function () { node.remove(); }, 420);
    }, 4600);
  }

  function demoCheckout() {
    toast("This is a theme demo \u2014 checkout is not connected.", "View brand DNA", function () {
      window.location.href = "about.html";
    });
  }

  /* ----------------------------------------------------------------- chrome */
  function demoNote() {
    var hidden = false;
    try { hidden = localStorage.getItem(NOTE_KEY) === "1"; } catch (err) { /* noop */ }
    if (hidden) return '<div id="moon-demo-note"></div>';
    return '' +
      '<div class="demo-note" id="moon-demo-note">' +
        '<div class="wrap demo-note__inner">' +
          /* a phone has no room for the long line: it wraps to three rows and
             pushes the whole page down, so the short label is used there */
          '<span class="demo-note__full">MOONALIENLIKE &times; Satoshi theme \u2014 interactive demo build</span>' +
          '<span class="demo-note__short">Satoshi theme demo build</span>' +
          '<button type="button" class="micro" data-note-dismiss style="text-decoration:underline">Dismiss</button>' +
        '</div>' +
      '</div>';
  }

  function announce() {
    var lines = [
      "Free shipping across India on orders over " + money(FREE_SHIP),
      "Boot Leg \u201972 \u2014 hand-stitched by a 72-year-old master tailor",
      "Limited runs \u00b7 designed in India",
      "New: Toji Pants in black",
      "Silhouette before graphics"
    ];
    var half = lines.map(function (l) { return '<span class="marquee__item">' + esc(l) + "</span>"; }).join("");
    return '<div class="announce" role="region" aria-label="Store announcements"><div class="marquee" data-marquee>' +
      half + half + "</div></div>";
  }

  function header() {
    var path = (window.location.pathname.split("/").pop() || "index.html");
    var collection = param("collection") || "";
    var navHTML = NAV.map(function (item) {
      var current = "";
      if (item.id) {
        var isShop = (path === "shop.html" || path === "");
        if (isShop && collection === (item.id === "all" ? "" : item.id)) current = ' aria-current="page"';
      } else if (path === item.href) {
        current = ' aria-current="page"';
      }
      return '<a class="nav__link" href="' + item.href + '"' + current + ">" + esc(item.label) + "</a>";
    }).join("");

    return '' +
      '<header class="header" id="site-header" data-header>' +
        '<div class="header__bar wrap wrap--wide">' +
          '<div class="header__left">' +
            '<button class="burger" type="button" data-menu-open aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer">' +
              '<span class="burger__line"></span><span class="burger__line"></span><span class="burger__line"></span>' +
            "</button>" +
            '<nav class="nav" aria-label="Primary">' + navHTML + "</nav>" +
          "</div>" +
          '<a class="logo" href="index.html" aria-label="MOON \u2014 home">' +
            '<span class="logo__mark">' + ICON.moon + "</span>" +
            '<span class="logo__word">MOON</span>' +
            '<span class="logo__sub">Moonalienlike</span>' +
          "</a>" +
          '<div class="header__right">' +
            '<a class="nav__link header__vision" href="about.html">The Visionaries</a>' +
            '<button class="icon-btn" type="button" data-search-open aria-label="Search products">' + ICON.search + "</button>" +
            '<button class="icon-btn" type="button" data-cart-open aria-label="Open cart">' + ICON.bag +
              '<span class="cart-count" data-count="0" data-cart-count>0</span>' +
            "</button>" +
          "</div>" +
        "</div>" +
      "</header>";
  }

  function footer() {
    var year = new Date().getFullYear();
    var shopLinks = COLLECTIONS.map(function (c) {
      var href = c.id === "all" ? "shop.html" : "shop.html?collection=" + c.id;
      return '<a href="' + href + '">' + esc(c.title) + "</a>";
    }).join("");
    return '' +
      '<footer class="footer" data-footer>' +
        '<div class="wrap">' +
          '<div class="footer__top">' +
            /* The footer is capped at six heading-like rows: the three column
               titles, the demo-form note, the wordmark and the bottom bar.
               The newsletter's "The MOON list" eyebrow used to make a
               seventh, and it only repeated what the statement underneath it
               already says — so it was the row to drop. */
            "<div>" +
              '<p class="h3 serif" style="margin:0 0 1.25rem;max-width:34ch">Drops, maker stories and community nights \u2014 before they sell out.</p>' +
              '<form class="field" data-newsletter novalidate>' +
                '<label class="sr-only" for="footer-email">Email address</label>' +
                '<input id="footer-email" type="email" name="email" placeholder="you@email.com" autocomplete="email" required>' +
                "<button type=\"submit\">Join</button>" +
              "</form>" +
              '<p class="form-note">Demo form \u2014 no data is sent.</p>' +
            "</div>" +
            "<div>" +
              '<div class="footer__col-title">Shop</div>' +
              '<div class="footer__links">' + shopLinks + '<a href="shop.html?sort=price-asc">Under \u20B92,999</a></div>' +
            "</div>" +
            "<div>" +
              '<div class="footer__col-title">The brand</div>' +
              '<div class="footer__links">' +
                '<a href="about.html">The Visionaries</a>' +
                '<a href="journal.html">Journal</a>' +
                '<a href="about.html#craft">Craft &amp; makers</a>' +
                '<a href="contact.html">Contact</a>' +
                '<a href="contact.html#stockists">Stockists</a>' +
              "</div>" +
            "</div>" +
            "<div>" +
              '<div class="footer__col-title">Help</div>' +
              '<div class="footer__links">' +
                '<a href="contact.html#faq">Shipping &amp; returns</a>' +
                '<a href="contact.html#faq">Size guide</a>' +
                '<a href="contact.html#faq">Garment care</a>' +
                '<a href="contact.html#faq">Track an order</a>' +
                '<a href="contact.html">FAQs</a>' +
              "</div>" +
            "</div>" +
          "</div>" +
          '<div class="footer__word" aria-hidden="true">MOON</div>' +
          '<div class="footer__bottom">' +
            "<span>\u00a9 " + year + " Moonalienlike \u00b7 demo build</span>" +
            '<div class="socials"><a href="#" data-demo-link>Instagram</a><a href="#" data-demo-link>YouTube</a><a href="#" data-demo-link>Substack</a></div>' +
            '<div class="pay"><span>UPI</span><span>VISA</span><span>MASTERCARD</span><span>RUPAY</span><span>AMEX</span><span>COD</span></div>' +
          "</div>" +
        "</div>" +
      "</footer>";
  }

  function overlays() {
    return '' +
      '<div class="scrim" data-scrim hidden></div>' +

      /* mobile nav */
      '<aside class="drawer drawer--left" id="nav-drawer" data-drawer="nav" aria-label="Menu" aria-hidden="true">' +
        '<div class="drawer__head"><h2>Menu</h2>' +
          '<button class="close-btn" type="button" data-close aria-label="Close menu">' + ICON.close + "</button>" +
        "</div>" +
        '<div class="drawer__body">' +
          NAV.map(function (item) {
            var subs = "";
            if (item.id) {
              subs = '<div class="mnav__sub">' + inCollection(item.id).slice(0, 4).map(function (p) {
                return '<a href="product.html?handle=' + p.handle + '">' + esc(p.title) + " \u00b7 " + money(p.price) + "</a>";
              }).join("") + "</div>";
            }
            return '<div class="mnav__group"><a class="mnav__link" href="' + item.href + '">' + esc(item.label) +
              (item.id ? "<span>" + pluralise(inCollection(item.id).length, "piece") + "</span>" : "") + "</a>" + subs + "</div>";
          }).join("") +
          '<div class="mnav__group"><a class="mnav__link" href="about.html">The Visionaries<span>Brand DNA</span></a></div>' +
          '<div class="mnav__group"><a class="mnav__link" href="contact.html">Contact<span>Say hello</span></a></div>' +
          '<div class="mnav__foot">' +
            '<a class="btn btn--outline btn--block" href="shop.html">Shop the catalog</a>' +
            '<p class="form-note">MOONALIENLIKE \u00b7 designed in India</p>' +
          "</div>" +
        "</div>" +
      "</aside>" +

      /* search */
      '<aside class="drawer drawer--full" data-drawer="search" aria-label="Search" aria-hidden="true">' +
        '<div class="drawer__head"><h2>Search</h2>' +
          '<button class="close-btn" type="button" data-close aria-label="Close search">' + ICON.close + "</button>" +
        "</div>" +
        '<div class="drawer__body">' +
          '<div class="search-field">' + ICON.search +
            '<label class="sr-only" for="search-input">Search products</label>' +
            '<input id="search-input" type="search" placeholder="Search silhouettes, fabric, colour\u2026" autocomplete="off">' +
          "</div>" +
          '<div class="search-sug" data-search-suggestions></div>' +
          '<div class="search-results" data-search-results></div>' +
        "</div>" +
      "</aside>" +

      /* cart */
      '<aside class="drawer" data-drawer="cart" aria-label="Cart" aria-hidden="true">' +
        '<div class="drawer__head"><h3>Your bag <span data-cart-label class="muted"></span></h3>' +
          '<button class="close-btn" type="button" data-close aria-label="Close cart">' + ICON.close + "</button>" +
        "</div>" +
        '<div class="drawer__body" data-cart-body></div>' +
        '<div class="drawer__foot" data-cart-foot hidden></div>' +
      "</aside>" +

      /* lightbox for product stills */
      '<aside class="drawer drawer--full" data-drawer="zoom" aria-label="Image viewer" aria-hidden="true">' +
        '<div class="drawer__head"><h2>Detail</h2>' +
          '<button class="close-btn" type="button" data-close aria-label="Close image viewer">' + ICON.close + "</button>" +
        "</div>" +
        '<div class="drawer__body" style="display:grid;place-items:center;background:var(--ink)" data-zoom-body></div>' +
      "</aside>" +

      '<div class="toast-stack" aria-live="polite" aria-atomic="false"></div>';
  }

  /* ---------------------------------------------------------- drawer engine */
  var openDrawer = null;

  function drawerEl(name) { return $('[data-drawer="' + name + '"]'); }

  function openPanel(name) {
    var el = drawerEl(name);
    if (!el) return;
    if (openDrawer && openDrawer !== el) closePanel();
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    $("[data-scrim]").hidden = false;
    $("[data-scrim]").classList.add("is-open");
    document.body.classList.add("is-locked");
    openDrawer = el;
    var focusable = el.querySelector("input, button, a[href]");
    if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 120);
  }

  function closePanel() {
    if (!openDrawer) return;
    openDrawer.classList.remove("is-open");
    openDrawer.setAttribute("aria-hidden", "true");
    openDrawer = null;
    var scrim = $("[data-scrim]");
    if (scrim) { scrim.classList.remove("is-open"); scrim.hidden = true; }
    document.body.classList.remove("is-locked");
  }

  /* ------------------------------------------------------------------- cart */
  function cartShipBar() {
    var subtotal = cart.subtotal();
    var pct = Math.min(100, Math.round((subtotal / FREE_SHIP) * 100));
    var label = subtotal >= FREE_SHIP
      ? "Complimentary shipping unlocked"
      : money(FREE_SHIP - subtotal) + " away from free shipping";
    return '<div class="ship-bar"><div class="ship-bar__track"><div class="ship-bar__fill" style="width:' + pct + '%"></div></div>' +
      '<div class="ship-bar__label micro muted">' + esc(label) + "</div></div>";
  }

  function renderCart() {
    var count = cart.count();
    $$("[data-cart-count]").forEach(function (node) {
      node.textContent = count;
      node.setAttribute("data-count", String(count));
    });
    var label = $("[data-cart-label]");
    if (label) label.textContent = count ? "\u00b7 " + pluralise(count, "item") : "";

    var body = $("[data-cart-body]");
    var foot = $("[data-cart-foot]");
    if (!body) return;

    if (!cart.all().length) {
      body.innerHTML = '<div class="empty-state">' +
        '<p class="h3 serif">Your bag is empty.</p>' +
        '<p class="small muted" style="margin:.75rem 0 1.5rem">Start with the silhouettes the label is built on.</p>' +
        '<a class="btn btn--outline" href="shop.html">Shop the catalog</a>' +
        "</div>";
      if (foot) foot.hidden = true;
      return;
    }

    if (foot) foot.hidden = false;

    body.innerHTML = cartShipBar() + cart.all().map(function (item) {
      var meta = [item.size, item.color].filter(Boolean).map(function (v) { return esc(v); }).join(" \u00b7 ");
      return '<div class="line-item">' +
        '<a href="product.html?handle=' + esc(item.handle) + '">' +
          '<img src="' + imgUrl(item.image, 200) + '" alt="' + esc(item.title) + '" loading="lazy">' +
        "</a>" +
        "<div>" +
          '<div class="line-item__head">' +
            '<a class="line-item__title" href="product.html?handle=' + esc(item.handle) + '">' + esc(item.title) + "</a>" +
            "<span>" + money(item.price * item.qty) + "</span>" +
          "</div>" +
          '<div class="line-item__meta">' + meta + "</div>" +
          '<div class="line-item__foot">' +
            '<div class="qty">' +
              '<button type="button" data-cart-dec="' + esc(item.key) + '" aria-label="Decrease quantity">\u2212</button>' +
              '<input type="text" inputmode="numeric" value="' + item.qty + '" data-cart-qty="' + esc(item.key) + '" aria-label="Quantity">' +
              '<button type="button" data-cart-inc="' + esc(item.key) + '" aria-label="Increase quantity">+</button>' +
            "</div>" +
            '<button type="button" class="icon-link" data-cart-remove="' + esc(item.key) + '">Remove</button>' +
          "</div>" +
        "</div>" +
      "</div>";
    }).join("");

    if (foot) {
      foot.innerHTML = '' +
        '<div class="totals">' +
          '<div class="totals__row"><span>Subtotal</span><span>' + money(cart.subtotal()) + "</span></div>" +
          '<div class="totals__row"><span>Shipping</span><span>' + (cart.subtotal() >= FREE_SHIP ? "Complimentary" : "Calculated at checkout") + "</span></div>" +
          '<div class="totals__row totals__row--grand"><span>Total</span><span>' + money(cart.subtotal()) + "</span></div>" +
        "</div>" +
        '<button class="btn btn--block" type="button" data-checkout>Checkout</button>' +
        '<p class="form-note" style="text-align:center">Demo build \u2014 payments are not connected.</p>';
    }
  }

  function addToCart(handle, size, color, qty, openIt) {
    var product = findProduct(handle);
    if (!product) return;
    cart.add(product, size, color, qty || 1);
    renderCart();
    var badge = $("[data-cart-count]");
    if (badge) {
      badge.classList.add("is-bump");
      setTimeout(function () { badge.classList.remove("is-bump"); }, 320);
    }
    if (openIt !== false) openPanel("cart");
    toast(product.title + (size ? " \u00b7 " + size : "") + " added to bag", "Checkout", demoCheckout);
  }

  /* ------------------------------------------------------------ product card */
  function availability(product, size, color) {
    if (product.sold_out) return false;
    var matches = product.variants.filter(function (v) {
      if (v.size !== size) return false;
      if (color && v.color && v.color !== color) return false;
      return true;
    });
    return matches.some(function (v) { return v.available; });
  }

  function cardHTML(product, options) {
    options = options || {};
    var lazy = options.eager ? "" : ' loading="lazy"';
    var main = product.images[0] || {};
    var alt = product.images[1] || main;
    var badges = [];
    if (product.sold_out) badges.push('<span class="badge badge--dark">Sold out</span>');
    else if (product.inventory <= 8) badges.push('<span class="badge badge--muted">Low stock</span>');
    if (product.collections.some(function (c) { return c.id === "wild"; })) badges.push('<span class="badge">Capsule</span>');

    var swatches = product.colors.slice(0, 4).map(function (c) {
      return '<span class="swatch-dot" style="background:' + swatch(c) + '" title="' + esc(c) + '"></span>';
    }).join("");

    var quick;
    if (product.sold_out) {
      quick = '<button class="btn btn--light btn--block btn--sm is-disabled" type="button" disabled>Sold out</button>';
    } else if (product.sizes.length > 1 || product.sizes[0] !== "One Size") {
      quick = '<div class="quick__sizes">' + product.sizes.map(function (size) {
        var ok = availability(product, size, product.colors[0] || "");
        return '<button class="quick__size" type="button"' + (ok ? "" : " disabled") +
          ' data-quick-add="' + esc(product.handle) + '" data-size="' + esc(size) + '">' + esc(size) + "</button>";
      }).join("") + "</div>" +
      '<button class="btn btn--block btn--sm quick__add" type="button" data-quick-open="' + esc(product.handle) + '">Choose options</button>';
    } else {
      quick = '<button class="btn btn--block btn--sm" type="button" data-quick-add="' + esc(product.handle) + '" data-size="One Size">Add to bag</button>';
    }

    return '' +
      '<article class="card reveal" data-card="' + esc(product.handle) + '">' +
        '<div class="card__media' + (product.images.length < 2 ? " card__media--single" : "") + '">' +
          '<a class="card__link" href="product.html?handle=' + esc(product.handle) + '" aria-label="' + esc(product.title) + '">' +
            '<img class="card__img--main" src="' + imgUrl(main.src, 800) + '" srcset="' + srcset(main.src) + '" sizes="(max-width:820px) 50vw, 25vw" alt="' + esc(main.alt || product.title) + '"' + lazy + ">" +
            (product.images.length > 1
              ? '<img class="card__img--alt" src="' + imgUrl(alt.src, 800) + '" alt="' + esc(alt.alt || product.title) + ' \u2014 alternate view" loading="lazy">'
              : "") +
          "</a>" +
          (badges.length ? '<div class="card__badges">' + badges.join("") + "</div>" : "") +
          '<div class="card__quick">' + quick + "</div>" +
        "</div>" +
        '<div class="card__info">' +
          "<div>" +
            '<h3 class="card__title"><a href="product.html?handle=' + esc(product.handle) + '">' + esc(product.title) + "</a></h3>" +
            '<div class="card__type">' + esc(product.type || "Apparel") + "</div>" +
            (swatches ? '<div class="card__swatches">' + swatches + "</div>" : "") +
          "</div>" +
          '<div class="card__price">' + money(product.price) + "</div>" +
        "</div>" +
      "</article>";
  }

  function gridHTML(products, options) {
    if (!products.length) {
      return '<div class="collection-empty"><p class="h3 serif">Nothing here yet.</p>' +
        '<p class="small muted" style="margin-top:.75rem">Try another category.</p></div>';
    }
    return '<div class="product-grid' + (options && options.cols ? " product-grid--" + options.cols : "") + '">' +
      products.map(function (p, i) { return cardHTML(p, { eager: i < 4 }); }).join("") + "</div>";
  }

  /* --------------------------------------------------------------- accordion */
  function initAccordions(root) {
    $$(".acc-item", root || document).forEach(function (item) {
      var trigger = $(".acc-trigger", item);
      var panel = $(".acc-panel", item);
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");
      if (item.classList.contains("is-open")) panel.style.height = "auto";
      trigger.addEventListener("click", function () {
        var isOpen = item.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(isOpen));
        panel.style.height = isOpen ? panel.scrollHeight + "px" : "0px";
        if (isOpen) {
          setTimeout(function () {
            if (item.classList.contains("is-open")) panel.style.height = "auto";
          }, 460);
        }
      });
    });
  }

  /* ----------------------------------------------- swipeable category rail */
  /* The track is a real horizontal scroll container with CSS scroll-snap, so
     touch swipe and trackpad gestures work with no JS at all. This adds the
     three things a scroll container cannot do by itself: mouse dragging on
     desktop, arrow buttons, and a progress bar that tells you how far along
     the rail you are. */
  function initRails() {
    $$("[data-rail]").forEach(function (rail) {
      var track = $("[data-rail-track]", rail);
      if (!track) return;
      var prev = $("[data-rail-prev]", rail);
      var next = $("[data-rail-next]", rail);
      var fill = $("[data-rail-fill]", rail);

      function maxScroll() { return Math.max(0, track.scrollWidth - track.clientWidth); }

      function step() {
        var slide = track.firstElementChild;
        if (!slide) return track.clientWidth;
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return slide.getBoundingClientRect().width + gap;
      }

      function sync() {
        var max = maxScroll();
        var overflow = max > 4;
        if (prev) prev.disabled = !overflow || track.scrollLeft <= 2;
        if (next) next.disabled = !overflow || track.scrollLeft >= max - 2;
        if (fill) {
          if (!overflow) {
            fill.style.width = "100%";
            fill.style.transform = "translateX(0)";
          } else {
            /* a proportional thumb travelling the full track, like a scrollbar */
            var ratio = track.clientWidth / track.scrollWidth;
            fill.style.width = (ratio * 100).toFixed(2) + "%";
            fill.style.transform = "translateX(" + ((track.scrollLeft / max) * (100 / ratio - 100)).toFixed(2) + "%)";
          }
        }
      }

      /* respect a reduced-motion preference: animate only if the user allows it */
      function motion() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      }

      function go(direction) {
        track.scrollBy({ left: direction * step(), behavior: motion() });
      }

      if (prev) prev.addEventListener("click", function () { go(-1); });
      if (next) next.addEventListener("click", function () { go(1); });

      track.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);

      /* keyboard: the track is focusable and behaves like a filmstrip */
      track.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") { go(1); event.preventDefault(); }
        else if (event.key === "ArrowLeft") { go(-1); event.preventDefault(); }
        else if (event.key === "Home") { track.scrollTo({ left: 0, behavior: motion() }); event.preventDefault(); }
        else if (event.key === "End") { track.scrollTo({ left: maxScroll(), behavior: motion() }); event.preventDefault(); }
      });

      /* mouse drag — pointer events cover mouse and pen; touch already swipes */
      var drag = null;
      var moved = false;

      track.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "touch" || event.button !== 0) return;
        drag = { x: event.clientX, left: track.scrollLeft, id: event.pointerId };
        moved = false;
        track.classList.add("is-dragging");
      });

      track.addEventListener("pointermove", function (event) {
        if (!drag || event.pointerId !== drag.id) return;
        var dx = event.clientX - drag.x;
        if (Math.abs(dx) > 4) {
          if (!moved) { moved = true; track.setPointerCapture(event.pointerId); }
          track.scrollLeft = drag.left - dx;
        }
      });

      function endDrag(event) {
        if (!drag || (event && event.pointerId !== drag.id)) return;
        drag = null;
        track.classList.remove("is-dragging");
        if (track.hasPointerCapture && track.hasPointerCapture(event.pointerId)) {
          track.releasePointerCapture(event.pointerId);
        }
        /* let the snap positions settle the card we landed nearest to */
        if (moved) {
          var width = step();
          var index = Math.round(track.scrollLeft / width);
          track.scrollTo({ left: Math.min(index * width, maxScroll()), behavior: motion() });
        }
      }

      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
      /* a drag that ends over a card must not also open that card. `detail` is 0
         for a keyboard-activated click, so Enter on a focused card still works
         even if a drag happened earlier. */
      track.addEventListener("click", function (event) {
        if (!moved) return;
        moved = false;
        if (event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
      }, true);

      sync();
      /* images settle the layout after load, which changes the scroll maths */
      if (document.readyState === "complete") sync();
      else window.addEventListener("load", sync);
    });
  }

  /* ----------------------------------------------------------------- reveal */
  function initReveal() {
    var nodes = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ------------------------------------------------------------------- home */
  function renderHome() {
    var hero = $('[data-render="hero"]');
    if (hero) {
      /* a campaign still the label already shot — zipper pants on a model */
      var feature = findProduct("zipper-pants-green");
      var still = feature && feature.images[1] ? feature.images[1] : null;
      if (still) {
        hero.innerHTML = '<img src="' + imgUrl(still.src, 1800) + '" srcset="' + srcset(still.src) +
          '" sizes="100vw" alt="MOONALIENLIKE campaign \u2014 ' + esc(feature.title) + '" fetchpriority="high">';
      }
    }

    var tiles = $('[data-render="collection-tiles"]');
    if (tiles) {
      /* all five collections, so the rail has somewhere to swipe to */
      var picks = [
        { id: "bottoms", product: "boot-leg-73", img: 0, note: "Boot cuts, baggy fits, convertible denim" },
        { id: "tops", product: "tween-shirt", img: 1, note: "Boxy shirting, collars, zip fronts" },
        { id: "caps", product: "lapze-cap", img: 0, note: "Leopard linen, embroidered detail" },
        { id: "wild", product: "wild", img: 0, note: "The leopard capsule, cut in linen" },
        { id: "all", product: "jogger-pants", img: 1, note: "Every silhouette in the studio" }
      ];
      tiles.innerHTML = picks.map(function (pick, i) {
        var list = inCollection(pick.id);
        var p = findProduct(pick.product) || list[0];
        var img = p.images[pick.img] || p.images[0];
        return '' +
          /* no per-card .reveal here: a card scrolled off the right of the rail
             would sit at opacity 0 while you drag toward it. The rail container
             carries the reveal instead. */
          '<a class="tile tile--wide" href="shop.html' +
              (pick.id === "all" ? "" : "?collection=" + pick.id) + '">' +
            '<div class="tile__media">' +
              '<img src="' + imgUrl(img.src, 1000) + '" srcset="' + srcset(img.src) + '" sizes="(max-width:820px) 82vw, 33vw" alt="' + esc(collectionTitle(pick.id)) + '" ' + (i === 0 ? "" : 'loading="lazy"') + ">" +
              '<span class="tile__veil"></span>' +
            "</div>" +
            '<div class="tile__body">' +
              "<div>" +
                '<h3 class="tile__title">' + esc(collectionTitle(pick.id)) + "</h3>" +
                '<div class="tile__count">' + pluralise(list.length, "piece") + " \u00b7 " + esc(pick.note) + "</div>" +
              "</div>" +
              '<span class="tile__arrow">' + ICON.arrow + "</span>" +
            "</div>" +
          "</a>";
      }).join("");
    }

    var featured = $('[data-render="featured"]');
    if (featured) {
      var order = ["boot-leg-73", "wild", "boot-leg-72", "lapze-cap", "zipper-pants-green", "jogger-pants", "polo-tee", "black-trooper-pants"];
      var list = order.map(findProduct).filter(Boolean);
      featured.innerHTML = gridHTML(list);
    }

    var wild = $('[data-render="wild-capsule"]');
    if (wild) {
      /* the capsule is leopard + linen: the WILD shirt and the Lapze Cap */
      var capsule = inCollection("wild").concat(PRODUCTS.filter(function (p) {
        return p.colors.indexOf("animal") > -1 && inCollection("wild").indexOf(p) === -1;
      }));
      wild.innerHTML = gridHTML(capsule, { cols: 3 });
    }

    var editorial = $('[data-render="editorial"]');
    if (editorial) {
      var cards = [
        { handle: "jogger-pants", img: 1, kicker: "Movement", title: "Toji, after hours", text: "A jogger cut from traditional Japanese workwear \u2014 wide, cuffed, unhurried." },
        { handle: "tween-shirt", img: 1, kicker: "Youth", title: "Snug, boxed and zipped", text: "Half sleeves and a silver front zip for the 18\u201325 MOON mindset." },
        { handle: "zipper-pants-green", img: 3, kicker: "Craft", title: "Adjustable by design", text: "Velcro side tabs and waist straps: the wearer finishes the silhouette." }
      ];
      editorial.innerHTML = cards.map(function (c, i) {
        var p = findProduct(c.handle);
        var img = p.images[c.img] || p.images[0];
        return '' +
          '<a class="ed-card reveal" href="product.html?handle=' + esc(p.handle) + '">' +
            '<div class="ed-card__media"><img src="' + imgUrl(img.src, 900) + '" srcset="' + srcset(img.src) + '" sizes="(max-width:820px) 100vw, 33vw" alt="' + esc(p.title) + '" ' + (i === 0 ? "" : 'loading="lazy"') + "></div>" +
            '<div class="ed-card__body">' +
              '<span class="eyebrow">' + esc(c.kicker) + "</span>" +
              '<h3 class="h3 serif">' + esc(c.title) + "</h3>" +
              '<p class="small muted">' + esc(c.text) + "</p>" +
              '<span class="text-cta" style="margin-top:.5rem">Read the story</span>' +
            "</div>" +
          "</a>";
      }).join("");
    }

  }

  /* Every page that shows the craft story uses the same still, so this runs on
     all pages rather than only the homepage. */
  function renderShared() {
    var stills = $$('[data-render="maker-still"]');
    if (!stills.length) return;
    var p = findProduct("boot-leg-72");
    if (!p) return;
    var img = p.images[0];
    stills.forEach(function (node) {
      node.innerHTML = '<img src="' + imgUrl(img.src, 1200) + '" srcset="' + srcset(img.src) +
        '" sizes="(max-width:1024px) 100vw, 50vw" alt="Boot Leg \u201972 \u2014 250 GSM dark blue denim" loading="lazy">' +
        '<span class="split__caption">Boot Leg \u201972 \u00b7 250 GSM denim</span>';
    });
  }

  /* ------------------------------------------------------------------- shop */
  function sortProducts(list, sort) {
    var copy = list.slice();
    if (sort === "price-asc") copy.sort(function (a, b) { return a.price - b.price; });
    else if (sort === "price-desc") copy.sort(function (a, b) { return b.price - a.price; });
    else if (sort === "title-asc") copy.sort(function (a, b) { return a.title.localeCompare(b.title); });
    else if (sort === "title-desc") copy.sort(function (a, b) { return b.title.localeCompare(a.title); });
    return copy;
  }

  function renderShop() {
    var grid = $("[data-render='shop-grid']");
    if (!grid) return;
    var state = {
      collection: param("collection") || "all",
      sort: param("sort") || "featured"
    };

    var facets = $("[data-facets]");
    if (facets) {
      facets.innerHTML = COLLECTIONS.map(function (c) {
        var n = inCollection(c.id).length;
        return '<a class="chip chip--facet' + (state.collection === c.id ? " is-active" : "") + '" href="shop.html' +
          (c.id === "all" ? "" : "?collection=" + c.id) + '"' + (state.collection === c.id ? ' aria-current="page"' : "") + ">" +
          esc(c.title) + " <span class=\"muted\">" + n + "</span></a>";
      }).join("");
    }

    var sortSelect = $("[data-sort]");
    if (sortSelect) {
      sortSelect.value = state.sort;
      sortSelect.addEventListener("change", function () {
        var params = new URLSearchParams(window.location.search);
        params.set("sort", sortSelect.value);
        window.location.search = params.toString();
      });
    }

    var products = sortProducts(inCollection(state.collection), state.sort);
    grid.innerHTML = gridHTML(products);

    var count = $("[data-result-count]");
    if (count) count.textContent = pluralise(products.length, "piece") + " in " + collectionTitle(state.collection).toLowerCase();

    var title = $("[data-collection-title]");
    if (title) title.textContent = state.collection === "all" ? "The Catalog" : collectionTitle(state.collection);

    var blurb = $("[data-collection-blurb]");
    if (blurb) {
      var blurbs = {
        all: "Every MOON silhouette currently in the studio \u2014 bottoms are the signature category.",
        bottoms: "Boot cuts, bell bottoms, baggy and convertible trousers. Silhouette before graphics.",
        tops: "Boxy shirting, statement collars and zip fronts built on the same construction logic.",
        caps: "Leopard linen and embroidered detail \u2014 the smallest canvas in the wardrobe.",
        wild: "The WILD capsule: leopard print, linen contrast, one shirt."
      };
      blurb.textContent = blurbs[state.collection] || blurbs.all;
    }

    var crumbs = $("[data-crumbs-current]");
    if (crumbs) crumbs.textContent = state.collection === "all" ? "Catalog" : collectionTitle(state.collection);

    document.title = (state.collection === "all" ? "Catalog" : collectionTitle(state.collection)) + " \u2014 MOON";
  }

  /* ---------------------------------------------------------------- product */
  function fitRows(product) {
    var rows = [
      ["Category", product.category ? product.category.split(">").pop().trim() : product.type],
      ["Fabric", product.fabric.length ? product.fabric.join(", ") : ""],
      ["Colour", product.colors.length ? product.colors.join(", ") : ""],
      ["Fit", product.fit],
      ["Silhouette", product.pants_length],
      ["Rise", product.rise],
      ["Neckline", product.neckline],
      ["Sleeve", product.sleeve],
      ["Headwear", product.headwear],
      ["Worn by", product.gender.length ? product.gender.join(" / ") : "unisex"]
    ].filter(function (row) { return row[1]; });

    return '<table class="spec-table"><tbody>' + rows.map(function (row) {
      return "<tr><th>" + esc(row[0]) + "</th><td>" + esc(row[1]) + "</td></tr>";
    }).join("") + "</tbody></table>";
  }

  function renderProduct() {
    var mount = $("[data-render='product']");
    if (!mount) return;

    var handle = param("handle");
    var product = findProduct(handle) || PRODUCTS[0];
    if (!product) return;

    var collection = product.collections[0] || { id: "all", title: "Catalog" };
    var state = {
      image: 0,
      size: product.sold_out ? "" : (product.sizes[0] || "One Size"),
      color: product.colors.length === 1 ? product.colors[0] : (product.colors[0] || ""),
      qty: 1
    };

    document.title = product.title + " \u2014 MOON";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", (product.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 155));

    var stock = product.sold_out
      ? '<span class="dot dot--out"></span>Sold out \u2014 join the waitlist'
      : (product.inventory <= 8
        ? '<span class="dot dot--low"></span>Only ' + product.inventory + " left across sizes"
        : '<span class="dot"></span>Limited run \u00b7 ships in 3\u20135 working days');

    var jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: (product.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300),
      brand: { "@type": "Brand", name: "Moonalienlike" },
      category: product.type,
      image: product.images.map(function (i) { return imgUrl(i.src, 1200); }),
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "INR",
        availability: product.sold_out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
      }
    };

    mount.innerHTML = '' +
      '<div class="wrap">' +
        '<nav class="breadcrumbs" aria-label="Breadcrumb" style="margin-bottom:1.5rem">' +
          '<a href="index.html">Home</a><span aria-hidden="true">/</span>' +
          '<a href="shop.html?collection=' + collection.id + '">' + esc(collection.title) + "</a>" +
          '<span aria-hidden="true">/</span><span>' + esc(product.title) + "</span>" +
        "</nav>" +

        '<div class="pdp">' +
          '<div class="pdp__gallery">' +
            '<div class="pdp__thumbs"><div class="pdp__thumbs-scroll">' +
              product.images.map(function (img, i) {
                return '<button class="pdp__thumb' + (i === 0 ? " is-active" : "") + '" type="button" data-thumb="' + i + '" aria-label="View image ' + (i + 1) + '">' +
                  '<img src="' + imgUrl(img.src, 200) + '" alt="' + esc(product.title) + ' thumbnail ' + (i + 1) + '" loading="lazy"></button>';
              }).join("") +
            "</div></div>" +
            '<div class="pdp__stills">' +
              '<figure class="pdp__still pdp__still--hero">' +
                '<img data-main-image src="' + imgUrl(product.images[0].src, 1400) + '" srcset="' + srcset(product.images[0].src) + '" sizes="(max-width:1024px) 100vw, 55vw" alt="' + esc(product.images[0].alt || product.title) + '">' +
                '<button class="pdp__zoom-hint" type="button" data-zoom="0">View full size</button>' +
              "</figure>" +
            "</div>" +
          "</div>" +

          '<div class="pdp__aside">' +
            '<div class="stack">' +
              '<span class="eyebrow">' + esc(product.vendor) + " \u00b7 " + esc(product.type || "Apparel") + "</span>" +
              '<h1 class="pdp__title">' + esc(product.title) + "</h1>" +
              '<div class="pdp__row">' +
                '<span class="pdp__price">' + money(product.price) + "</span>" +
                '<span class="pdp__stock">' + stock + "</span>" +
              "</div>" +
            "</div>" +

            (product.colors.length ? '<div class="stack"><span class="opt-label">Colour: <span class="muted" data-color-label>' + esc(state.color || "\u2014") + "</span></span>" +
              '<div class="color-list">' + product.colors.map(function (c) {
                return '<button class="color-btn' + (c === state.color ? " is-active" : "") + '" type="button" data-color="' + esc(c) + '">' +
                  '<span class="swatch-dot" style="background:' + swatch(c) + '"></span>' + esc(c) + "</button>";
              }).join("") + "</div></div>" : "") +

            '<div class="stack"><div class="pdp__row"><span class="opt-label">Size</span>' +
              '<button class="icon-link" type="button" data-size-guide>Size guide</button></div>' +
              '<div class="size-list">' + product.sizes.map(function (s) {
                var ok = availability(product, s, state.color);
                return '<button class="size-btn' + (s === state.size ? " is-active" : "") + '" type="button" data-size="' + esc(s) + '"' + (ok ? "" : " disabled") + ">" + esc(s) + "</button>";
              }).join("") + "</div>" +
              '<p class="small muted" data-size-hint>' + (product.fit ? "Designed with a " + esc(product.fit) + " fit." : "True to size.") + " Between sizes? Size up.</p>" +
            "</div>" +

            '<div class="pdp__actions">' +
              '<div class="qty" style="justify-self:start">' +
                '<button type="button" data-qty-dec aria-label="Decrease quantity">\u2212</button>' +
                '<input type="text" inputmode="numeric" value="1" data-qty-input aria-label="Quantity">' +
                '<button type="button" data-qty-inc aria-label="Increase quantity">+</button>' +
              "</div>" +
              '<button class="btn btn--block" type="button" data-add-to-cart' + (product.sold_out ? " disabled" : "") + ">" +
                (product.sold_out ? "Sold out" : "Add to bag") + "</button>" +
              '<button class="btn btn--outline btn--block" type="button" data-buy-now' + (product.sold_out ? " disabled" : "") + ">Buy it now</button>" +
            "</div>" +

            '<div class="usp">' +
              '<div class="usp__row">' + ICON.truck + "<span>Free shipping across India over " + money(FREE_SHIP) + "</span></div>" +
              '<div class="usp__row">' + ICON.refresh + "<span>14-day exchange on unworn pieces</span></div>" +
              '<div class="usp__row">' + ICON.shield + "<span>Limited run \u00b7 small-batch tailoring</span></div>" +
            "</div>" +

            '<div class="accordion">' +
              '<div class="acc-item is-open">' +
                '<button class="acc-trigger" type="button"><span class="acc-trigger__t">Description</span><span class="acc-trigger__i"></span></button>' +
                '<div class="acc-panel"><div class="acc-panel__inner">' + safeBody(product.body) + "</div></div>" +
              "</div>" +
              '<div class="acc-item">' +
                '<button class="acc-trigger" type="button"><span class="acc-trigger__t">Fit &amp; specification</span><span class="acc-trigger__i"></span></button>' +
                '<div class="acc-panel"><div class="acc-panel__inner">' + fitRows(product) + "</div></div>" +
              "</div>" +
              '<div class="acc-item">' +
                '<button class="acc-trigger" type="button"><span class="acc-trigger__t">Shipping &amp; returns</span><span class="acc-trigger__i"></span></button>' +
                '<div class="acc-panel"><div class="acc-panel__inner">' +
                  "<p>Dispatched from the MOON studio in India within 3\u20135 working days. Free shipping on orders over " + money(FREE_SHIP) + ".</p>" +
                  "<p>14-day exchange on unworn pieces with tags attached. Pieces made to order and altered pieces are final sale.</p>" +
                  "<p><em>Demo build \u2014 policy copy is placeholder, not the live store's terms.</em></p>" +
                "</div></div>" +
              "</div>" +
              '<div class="acc-item" id="size-guide">' +
                '<button class="acc-trigger" type="button"><span class="acc-trigger__t">Size guide</span><span class="acc-trigger__i"></span></button>' +
                '<div class="acc-panel"><div class="acc-panel__inner">' +
                  "<p>MOON bottoms and tops are sized S\u2013L and cut unisex unless stated. The label builds for a relaxed silhouette, so if you are between sizes, take the larger one.</p>" +
                  "<p>Boot Leg \u201972 and '73 are high-waisted with a flare from the knee. Toji Pants run baggy with a cuffed ankle. Lapze Cap is one size with an adjustable fit.</p>" +
                  "<p>Need a measurement before you commit? Message the studio and the team will measure the piece you are looking at.</p>" +
                "</div></div>" +
              "</div>" +
              '<div class="acc-item">' +
                '<button class="acc-trigger" type="button"><span class="acc-trigger__t">The maker</span><span class="acc-trigger__i"></span></button>' +
                '<div class="acc-panel"><div class="acc-panel__inner">' +
                  "<p>MOON works with small local units rather than volume factories. Every drop is capped, and the maker is part of the product story rather than a footnote.</p>" +
                "</div></div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +

        '<section class="section section--tight">' +
          '<div class="sec-head"><div class="sec-head__text">' +
            '<span class="eyebrow">Detail</span>' +
            '<h2 class="h2 serif" style="margin-top:.5rem">Construction, close up</h2>' +
          "</div></div>" +
          '<div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
            product.images.slice(1).map(function (img, i) {
              return '<figure class="pdp__still"><img src="' + imgUrl(img.src, 1200) + '" srcset="' + srcset(img.src) + '" sizes="(max-width:820px) 100vw, 50vw" alt="' + esc(product.title) + " detail " + (i + 2) + '" loading="lazy">' +
                '<button class="pdp__zoom-hint" type="button" data-zoom="' + (i + 1) + '">View full size</button></figure>';
            }).join("") +
          "</div>" +
        "</section>" +

        makerBlock(product) +

        '<section class="section section--tight">' +
          '<div class="sec-head">' +
            '<div class="sec-head__text">' +
              '<span class="eyebrow">Styled with</span>' +
              '<h2 class="h2 serif" style="margin-top:.5rem">More from ' + esc(collection.title) + "</h2>" +
            "</div>" +
            '<a class="text-cta" href="shop.html?collection=' + collection.id + '">Shop all ' + esc(collection.title) + " " + ICON.arrow + "</a>" +
          "</div>" +
          '<div data-related></div>' +
        "</section>" +
      "</div>" +

      '<script type="application/ld+json">' + JSON.stringify(jsonLd) + "<\/script>";

    /* related products */
    var related = inCollection(collection.id).filter(function (p) { return p.handle !== product.handle; });
    if (related.length < 2) related = PRODUCTS.filter(function (p) { return p.handle !== product.handle; });
    var relatedMount = $("[data-related]", mount);
    if (relatedMount) relatedMount.innerHTML = gridHTML(related.slice(0, 4));

    initAccordions(mount);
    bindProductEvents(mount, product, state);
    initStickyAtc(product);
    initReveal();
  }

  function makerBlock(product) {
    var isTailored = product.handle.indexOf("boot-leg") === 0;
    if (!isTailored) return "";
    var img = findProduct("boot-leg-73").images[0];
    return '' +
      '<section class="section section--tight">' +
        '<div class="maker">' +
          '<div class="split__media split__media--wide" style="aspect-ratio:16/11">' +
            '<img src="' + imgUrl(img.src, 1100) + '" alt="Boot Leg construction" loading="lazy">' +
            '<span class="split__caption">Made by hand, 50+ years of tailoring</span>' +
          "</div>" +
          "<div>" +
            '<span class="eyebrow">Craft</span>' +
            '<blockquote class="maker__quote" style="margin:.85rem 0 1.25rem">\u201cFifty years of cutting, and the flare still has to fall exactly right.\u201d</blockquote>' +
            '<p class="muted">Boot Leg \u201972 is hand-stitched by a 72-year-old master tailor \u2014 single-needle side seams, belt loops bar-tacked by hand, hems turned by hand \u2014 in 250 GSM denim, true to the \u201980s\u2013\u201990s bell. Boot Leg \u201973 takes the same handwork into a clean glossy finish.</p>' +
            '<div class="stats">' +
              '<div class="stat"><div class="stat__n">72</div><div class="stat__l">Tailor\u2019s age</div></div>' +
              '<div class="stat"><div class="stat__n">50+</div><div class="stat__l">Years\u2019 experience</div></div>' +
              '<div class="stat"><div class="stat__n">250</div><div class="stat__l">GSM denim</div></div>' +
            "</div>" +
          "</div>" +
        "</div>" +
      "</section>";
  }

  function bindProductEvents(mount, product, state) {
    function mainImage() { return $("[data-main-image]", mount); }

    function paint() {
      var img = product.images[state.image] || product.images[0];
      var main = mainImage();
      if (main) {
        main.src = imgUrl(img.src, 1400);
        main.srcset = srcset(img.src);
        main.alt = img.alt || product.title;
      }
      $$("[data-thumb]", mount).forEach(function (btn) {
        btn.classList.toggle("is-active", Number(btn.getAttribute("data-thumb")) === state.image);
      });
      $$("[data-size]", mount).forEach(function (btn) {
        var s = btn.getAttribute("data-size");
        var ok = availability(product, s, state.color);
        btn.disabled = !ok;
        btn.classList.toggle("is-active", s === state.size);
      });
      $$("[data-color]", mount).forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-color") === state.color);
      });
      var label = $("[data-color-label]", mount);
      if (label) label.textContent = state.color || "\u2014";

      var soldOut = product.sold_out || !availability(product, state.size, state.color);
      var atc = $("[data-add-to-cart]", mount);
      if (atc) {
        atc.disabled = soldOut;
        atc.textContent = product.sold_out ? "Sold out" : (soldOut ? "Unavailable in this combination" : "Add to bag");
      }
      var buyNow = $("[data-buy-now]", mount);
      if (buyNow) buyNow.disabled = soldOut;
      var stickyBtn = $("[data-sticky-add]");
      if (stickyBtn) {
        stickyBtn.disabled = product.sold_out;
        var stickySize = $("[data-sticky-size]");
        if (stickySize) stickySize.textContent = state.size + (state.color ? " \u00b7 " + state.color : "");
      }
    }

    mount.addEventListener("click", function (event) {
      var thumb = event.target.closest("[data-thumb]");
      if (thumb) {
        state.image = Number(thumb.getAttribute("data-thumb"));
        paint();
        return;
      }

      var zoom = event.target.closest("[data-zoom]");
      if (zoom) {
        var index = Number(zoom.getAttribute("data-zoom"));
        var img = product.images[index] || product.images[0];
        var body = $("[data-zoom-body]");
        if (body) {
          body.innerHTML = '<img src="' + imgUrl(img.src, 1800) + '" alt="' + esc(product.title) + '" style="max-height:82vh;width:auto">';
        }
        openPanel("zoom");
        return;
      }

      var sizeBtn = event.target.closest("[data-size]");
      if (sizeBtn && !sizeBtn.disabled) {
        state.size = sizeBtn.getAttribute("data-size");
        paint();
        return;
      }

      var colorBtn = event.target.closest("[data-color]");
      if (colorBtn) {
        state.color = colorBtn.getAttribute("data-color");
        paint();
        return;
      }

      if (event.target.closest("[data-qty-inc]")) {
        state.qty = Math.min(9, state.qty + 1);
        $("[data-qty-input]", mount).value = state.qty;
        return;
      }
      if (event.target.closest("[data-qty-dec]")) {
        state.qty = Math.max(1, state.qty - 1);
        $("[data-qty-input]", mount).value = state.qty;
        return;
      }
      if (event.target.closest("[data-size-guide]")) {
        var guide = $("#size-guide", mount);
        if (guide) {
          guide.classList.add("is-open");
          var trigger = $(".acc-trigger", guide);
          var panel = $(".acc-panel", guide);
          if (trigger) trigger.setAttribute("aria-expanded", "true");
          if (panel) panel.style.height = panel.scrollHeight + "px";
          guide.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      if (event.target.closest("[data-add-to-cart]")) {
        addToCart(product.handle, state.size, state.color, state.qty);
        return;
      }
      if (event.target.closest("[data-buy-now]")) {
        if (product.sold_out) return;
        addToCart(product.handle, state.size, state.color, state.qty, false);
        demoCheckout();
      }
    });

    var qtyField = $("[data-qty-input]", mount);
    if (qtyField) {
      qtyField.addEventListener("change", function () {
        var v = Math.max(1, Math.min(9, parseInt(qtyField.value, 10) || 1));
        state.qty = v;
        qtyField.value = v;
      });
    }

    paint();
  }

  function initStickyAtc(product) {
    var bar = $("[data-sticky-atc]");
    if (!bar) return;
    bar.innerHTML = '' +
      '<div class="sticky-atc__info">' +
        '<div class="sticky-atc__title">' + esc(product.title) + '</div>' +
        '<div class="sticky-atc__price">' + money(product.price) + ' \u00b7 <span data-sticky-size></span></div>' +
      "</div>" +
      '<button class="btn btn--sm" type="button" data-sticky-add' + (product.sold_out ? " disabled" : "") + ">" +
        (product.sold_out ? "Sold out" : "Add to bag") + "</button>";
    bar.querySelector("[data-sticky-add]").addEventListener("click", function () {
      var sizeEl = document.querySelector(".size-btn.is-active:not([disabled])");
      addToCart(product.handle, sizeEl ? sizeEl.getAttribute("data-size") : product.sizes[0], product.colors[0] || "", 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        bar.classList.toggle("is-visible", past);
      });
    }, { threshold: 0 });
    io.observe($(".pdp"));
  }

  /* ---------------------------------------------------------------- journal */
  function renderJournal() {
    var mount = $('[data-render="journal"]');
    if (!mount) return;
    var cards = [
      { handle: "boot-leg-72", img: 0, kicker: "Drop log \u00b7 08", title: "Building a clothing drop with \u20B910,000", text: "Sourcing denim, sampling with the tailor, and the first honest look at margins.", time: "9 min read" },
      { handle: "lapze-cap", img: 0, kicker: "Maker story", title: "The 72-year-old who hand-stitches our bell bottoms", text: "Fifty years at the table, a single needle, and why Boot Leg \u201972 exists as a person, not a product code.", time: "6 min read" },
      { handle: "tween-shirt", img: 2, kicker: "Indian identity", title: "Saree upcycling, and what we refuse to do", text: "Why MOON borrows textile and technique instead of printing India onto Western shapes.", time: "7 min read" },
      { handle: "jorts-cum-pants", img: 1, kicker: "Design note", title: "Two looks in one: the convertible jort", text: "A button system that turns a trouser into a jort, and what that does to a wardrobe.", time: "4 min read" },
      { handle: "zipper-pants-green", img: 2, kicker: "Craft", title: "Egyptian Giza cotton, adjusted by the wearer", text: "Velcro tabs and waist straps let the person finish the silhouette.", time: "5 min read" },
      { handle: "wild", img: 1, kicker: "Capsule", title: "WILD: leopard, linen, and one clean white shirt", text: "Restraint plus one loud detail \u2014 the formula behind the WILD capsule.", time: "3 min read" }
    ];
    mount.innerHTML = cards.map(function (c, i) {
      var p = findProduct(c.handle);
      var img = p.images[c.img] || p.images[0];
      return '' +
        '<article class="j-card reveal">' +
          '<div class="j-card__media"><img src="' + imgUrl(img.src, 900) + '" srcset="' + srcset(img.src) + '" sizes="(max-width:820px) 100vw, 33vw" alt="' + esc(p.title) + '" ' + (i < 3 ? "" : 'loading="lazy"') + "></div>" +
          '<div class="j-card__body">' +
            '<span class="j-card__meta">' + esc(c.kicker) + " \u00b7 " + esc(c.time) + "</span>" +
            '<h3 class="j-card__title">' + esc(c.title) + "</h3>" +
            '<p class="j-card__excerpt">' + esc(c.text) + "</p>" +
            '<div class="j-card__cta"><span class="text-cta">Read</span></div>' +
          "</div>" +
        "</article>";
    }).join("");
  }

  /* ------------------------------------------------------------------- bind */
  function bindChrome() {
    $$("[data-menu-open]").forEach(function (btn) {
      btn.addEventListener("click", function () { openPanel("nav"); });
    });
    $$("[data-search-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openPanel("search");
        setTimeout(function () { var i = $("#search-input"); if (i) i.focus(); }, 180);
      });
    });
    $$("[data-cart-open]").forEach(function (btn) {
      btn.addEventListener("click", function () { openPanel("cart"); });
    });
    $$("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", closePanel);
    });
    var scrim = $("[data-scrim]");
    if (scrim) scrim.addEventListener("click", closePanel);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePanel();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPanel("search");
      }
    });

    var dismiss = $("[data-note-dismiss]");
    if (dismiss) {
      dismiss.addEventListener("click", function () {
        try { localStorage.setItem(NOTE_KEY, "1"); } catch (err) { /* noop */ }
        var note = $("#moon-demo-note");
        if (note) note.remove();
      });
    }

    /* header behaviour: transparent over the hero, opaque and bordered once
       the page has scrolled past it.
       <body> also carries data-header (it holds the page's header mode), so
       the rendered header element has to be selected explicitly — matching
       [data-header] alone returned <body> and the transparent state never
       reached the header, leaving an opaque bar sitting over the hero.
       The header is deliberately never hidden on scroll: the shop toolbar,
       the product gallery and its thumbnails are all sticky offsets of
       --header-h, so a header that slides away leaves a gap above them. */
    var headerEl = $("header[data-header]") || $(".header");
    var hero = $(".hero");
    if (headerEl && hero && document.body.getAttribute("data-header") === "transparent") {
      headerEl.classList.add("is-transparent");
    }
    function onScroll() {
      if (!headerEl) return;
      var y = window.scrollY;
      var heroBottom = hero ? hero.offsetHeight - headerEl.offsetHeight : 0;
      if (hero) headerEl.classList.toggle("is-transparent", y < heroBottom - 40);
      headerEl.classList.toggle("is-stuck", y > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* marquee: duplicate so the loop is seamless on very wide screens */
    $$("[data-marquee]").forEach(function (track) {
      track.innerHTML = track.innerHTML + track.innerHTML;
    });

    /* global delegated actions */
    document.addEventListener("click", function (event) {
      var quick = event.target.closest("[data-quick-add]");
      if (quick) {
        event.preventDefault();
        addToCart(quick.getAttribute("data-quick-add"), quick.getAttribute("data-size"), "", 1);
        return;
      }
      var openProduct = event.target.closest("[data-quick-open]");
      if (openProduct) {
        window.location.href = "product.html?handle=" + openProduct.getAttribute("data-quick-open");
        return;
      }
      var demoLink = event.target.closest("[data-demo-link]");
      if (demoLink) {
        event.preventDefault();
        toast("Social links are placeholders in this demo build.");
        return;
      }
      if (event.target.closest("[data-checkout]")) { demoCheckout(); return; }

      var cartInc = event.target.closest("[data-cart-inc]");
      if (cartInc) {
        var key = cartInc.getAttribute("data-cart-inc");
        var item = cart.all().filter(function (i) { return i.key === key; })[0];
        cart.setQty(key, (item ? item.qty : 1) + 1);
        renderCart();
        return;
      }
      var cartDec = event.target.closest("[data-cart-dec]");
      if (cartDec) {
        var dkey = cartDec.getAttribute("data-cart-dec");
        var ditem = cart.all().filter(function (i) { return i.key === dkey; })[0];
        if (ditem && ditem.qty > 1) { cart.setQty(dkey, ditem.qty - 1); }
        else { cart.remove(dkey); }
        renderCart();
        return;
      }
      var cartRemove = event.target.closest("[data-cart-remove]");
      if (cartRemove) { cart.remove(cartRemove.getAttribute("data-cart-remove")); renderCart(); return; }
    });

    document.addEventListener("change", function (event) {
      var field = event.target.closest("[data-cart-qty]");
      if (field) {
        cart.setQty(field.getAttribute("data-cart-qty"), parseInt(field.value, 10) || 1);
        renderCart();
      }
    });

    /* search */
    var searchInput = $("#search-input");
    if (searchInput) {
      var suggestions = $("[data-search-suggestions]");
      var terms = ["Boot Leg", "Toji Pants", "leopard", "linen", "denim", "WILD", "Bottoms", "Caps", "under " + money(2999)];
      if (suggestions) {
        suggestions.innerHTML = terms.map(function (t) {
          return '<button class="chip" type="button" data-term="' + esc(t) + '">' + esc(t) + "</button>";
        }).join("");
        suggestions.addEventListener("click", function (event) {
          var chip = event.target.closest("[data-term]");
          if (!chip) return;
          searchInput.value = chip.getAttribute("data-term");
          runSearch();
        });
      }
      function runSearch() {
        var q = searchInput.value.trim().toLowerCase();
        var out = $("[data-search-results]");
        if (!out) return;
        if (!q) {
          out.innerHTML = '<p class="small muted">Try \u201cboot leg\u201d, \u201cleopard\u201d, \u201clinen\u201d or \u201cbottoms\u201d. Press \u2318K anywhere to search.</p>';
          return;
        }
        var numeric = q.match(/(\d{3,5})/);
        var results = PRODUCTS.filter(function (p) {
          var haystack = [p.title, p.handle, p.type, p.category, p.fabric.join(" "), p.colors.join(" "), p.fit, p.body.replace(/<[^>]+>/g, " ")].join(" ").toLowerCase();
          if (haystack.indexOf(q) > -1) return true;
          if (numeric && p.price <= parseInt(numeric[1], 10) + 200) return true;
          return false;
        });
        if (!results.length) {
          out.innerHTML = '<p class="small muted">No pieces match \u201c' + esc(searchInput.value) + '\u201d. Browse the <a class="link-underline" href="shop.html">catalog</a>.</p>';
          return;
        }
        out.innerHTML = '<p class="micro muted">' + pluralise(results.length, "result") + "</p>" + results.map(function (p) {
          return '<a class="sr-row" href="product.html?handle=' + esc(p.handle) + '">' +
            '<img src="' + imgUrl(p.images[0].src, 200) + '" alt="' + esc(p.title) + '" loading="lazy">' +
            "<span><span class=\"sr-row__title\" style=\"display:block;font-weight:500\">" + esc(p.title) + "</span>" +
            "<span class=\"micro muted\">" + esc(p.type) + "</span></span>" +
            "<span class=\"small\">" + money(p.price) + "</span></a>";
        }).join("");
      }
      searchInput.addEventListener("input", runSearch);
      runSearch();
    }

    /* newsletter + contact forms (demo) */
    $$("[data-newsletter]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[type=email]");
        if (!input || !input.value) { toast("Add an email address first."); return; }
        toast("You\u2019re on the list \u2014 (demo only, nothing was sent).");
        form.reset();
      });
    });
    $$("[data-contact-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        toast("Message queued \u2014 demo build, no email is delivered.");
        form.reset();
      });
    });

    /* demo anchor links (# placeholders) */
    $$('a[href="#"]').forEach(function (a) {
      if (!a.hasAttribute("data-demo-link")) a.setAttribute("data-demo-link", "");
    });

    /* smooth in-page anchors for the DNA page */
    $$("[data-dna-nav] a").forEach(function (a) {
      a.addEventListener("click", function () {
        $$("[data-dna-nav] a").forEach(function (x) { x.classList.remove("is-active"); });
        a.classList.add("is-active");
      });
    });
  }

  /* ------------------------------------------------------------------- init */
  function init() {
    var top = document.getElementById("moon-chrome-top");
    var bottom = document.getElementById("moon-chrome-bottom");
    if (top) top.innerHTML = demoNote() + announce() + header();
    if (bottom) bottom.innerHTML = footer() + overlays();

    if (!PRODUCTS.length) {
      var main = document.querySelector("main");
      if (main) {
        main.insertAdjacentHTML("afterbegin",
          '<div class="wrap section"><p class="lede">Product data failed to load. Run <code>python3 tools/build-products.py</code> to regenerate <code>assets/js/products.js</code>.</p></div>');
      }
    }

    var page = document.body.getAttribute("data-page");
    renderCart();
    bindChrome();
    renderShared();
    if (page === "home") renderHome();
    if (page === "shop") renderShop();
    if (page === "product") renderProduct();
    if (page === "journal") renderJournal();
    initRails();
    initReveal();
    initAccordions(document);
    fitImages(document);
  }

  /* ------------------------------------------------------------------ images
     The export carries a few very wide uploads (website screenshots at 4:1)
     alongside the studio shots. Cropped with object-fit: cover into a 4:5 card
     they lose ~80% of themselves and read as a sliver, so anything much wider
     than it is tall is letterboxed on the paper background instead. Tagging
     happens on load because the export has no intrinsic dimensions.        */
  var CONTAIN_RATIO = 1.2;

  function fitImage(img) {
    if (!img || img.tagName !== "IMG" || !img.naturalWidth || !img.naturalHeight) return;
    img.classList.toggle("is-contain", (img.naturalWidth / img.naturalHeight) > CONTAIN_RATIO);
  }

  function fitImages(root) {
    $$("img", root || document).forEach(fitImage);
  }

  /* load does not bubble, so listen in the capture phase to catch every image
     a renderer inserts later — lazy ones included */
  document.addEventListener("load", function (event) {
    fitImage(event.target);
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
