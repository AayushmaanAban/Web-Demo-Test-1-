# Hosting this demo for free, temporarily

The build is plain static HTML/CSS/JS with no build step, so any static host works. You need a
public URL you can paste into WhatsApp, a client email or an Instagram DM, and you want to be able
to take it down again afterwards.

## Fastest, no tools, no repo — Netlify Drop

1. Go to **https://app.netlify.com/drop** (sign in with GitHub/email when asked — the free tier is
   fine).
2. Drag the whole `moonalienlike-satoshi-demo` folder onto the page.
3. You get a URL like `https://random-name-123.netlify.app` in about ten seconds.
4. Rename it under **Site configuration → Change site name** → e.g. `moon-satoshi-demo.netlify.app`.
5. To remove it later: **Site configuration → Danger zone → Delete site**.

Best for: a link you need in the next five minutes. No CLI, no commit, no config.

## Recommended for a client-facing demo — Vercel

Gravity Index recommends Vercel for this: the Hobby plan is free, deploys static folders directly,
and every deploy gets its own URL, so you can keep iterating and still hand over one stable link.

```bash
npm i -g vercel
cd "moonalienlike-satoshi-demo"
vercel          # follow the prompts — accept the detected "Other"/static settings
vercel --prod   # produces the shareable production URL
```

Notes:
- No `vercel.json` is needed; `index.html` is served automatically.
- The free Hobby plan is for **non-commercial** projects. A client demo is fine; if this becomes
  the brand's live marketing site, move to Pro (or host on the brand's own domain).
- Delete the project from the Vercel dashboard when the demo is done.

## Also good, and free — Cloudflare Pages

Free with unlimited bandwidth, which matters if the demo gets shared widely and the images get hit
a lot. Dashboard-only path: **Workers & Pages → Create → Pages → Upload assets**, then drag the
folder in. Or connect a Git repo for automatic rebuilds. Delete the project to take it down.

## If the code is already in a Git repo — GitHub Pages

Push the folder, then **Settings → Pages → Deploy from branch → `/moonalienlike-satoshi-demo`**.
Free, but public if the repo is public, and the URL is a long `username.github.io/...` path.

## Publishing it right here

This workspace can also publish the demo to an agent-managed preview URL on request. Two caveats
worth knowing before you choose that route:

- Preview URLs are **public**, even though production requires explicit approval.
- It is meant for Cloudflare-Workers-shaped output. This build is already pure static assets, so
  it fits the "static assets + trivial Worker" pattern — but if you want to keep the demo on the
  brand's Shopify-adjacent stack, Vercel or Netlify is the simpler story.

## Two practical notes

- **Images** are loaded from the brand's Shopify CDN (`cdn.shopify.com`), not bundled. If the store
  is ever unpublished or those files are deleted, the demo loses its photography. If it needs to be
  safe for months, download the images into `assets/img/` and swap the URLs in
  `tools/build-products.py`.
- **Fonts** come from Fontshare (Satoshi) and Google Fonts (Instrument Serif). Both are free for
  commercial use, but self-hosting the woff2 files is the more robust option for a long-lived site.
