# Zencode website

A lightweight, multi-page website for Zencode. All pages render complete HTML without client-side JavaScript; navigation, search, project filtering, motion controls and enquiry handling progressively enhance the experience.

## Run locally

Uses Node.js 24. Install the pinned dependencies with `npm ci`. Motion powers the animation layer; esbuild bundles it locally.

```sh
npm ci
npm run build
npm run check
npm run dev
```

Open http://localhost:4173. Re-run the build after edits. Generated pages are in `dist/`, which is ignored by Git.

Optional browser smoke checks: with Python Playwright and Chromium installed and the local server running, run `python scripts/smoke.py`. This checks every page at three viewport sizes, filtering, mobile navigation, motion controls, FAQs and mocked form results. It blocks real form submissions and writes screenshots only to ignored `.preview/`.

## Editing

- `content/site.mjs`: business identity, canonical domain, service-oriented page metadata and project search titles.
- `scripts/seo.mjs`: consistent Open Graph/Twitter metadata, actual image dimensions and structured data.
- `scripts/discovery.mjs`: robots, sitemap, Markdown documents and LLM reference files generated from public content.
- `content/projects.json`: project summaries, case studies, categories, source links and stage labels.
- `content/flagship-projects.json`: Ancora AI, Hi-Tech Waste Management and Musaed, including scope, workflows and engineering decisions.
- `scripts/build.mjs`: shared layout, page content and HTML generation.
- `scripts/page-intros.mjs` / `page-themes.css`: distinct Work, Capabilities, Industries and Studio openings and page treatments within the shared brand.
- `scripts/visuals.mjs`: responsive interface studies of the three flagship projects.
- `content/site-copy.mjs`: capabilities and industry descriptions.
- `styles.css`: responsive design and the original moving grid/rain visual language.
- `product-previews.css`: isolated styling for the product interface illustrations.
- `app.js`: navigation, filtering, motion preference and enquiry submission.
- `motion-entry.js` / `motion.css`: scroll reveals, parallax, hover springs, accordion transitions and reduced-motion cleanup. Bundled to `dist/motion.js`.
- `THIRD_PARTY_NOTICES.txt`: Motion and its dependencies’ MIT license notices, also included in the deployment.
- `assets/projects/`: optimized public project previews and approved source imagery.
- `content/SOURCES.md`: provenance and limits for public project claims.

## Hosting

`vercel.json` builds the website and serves `dist/`. Each page and case study has a real URL; unknown paths use `404.html`. The GitHub Pages workflow also builds and checks the same output, so the existing hosting remains compatible during migration. Canonicals and the generated sitemap use `https://zencode.my`.

Vercel project: `randomzzguys-projects/zencode-website`. Review URL: https://zencode-website.vercel.app. Deploy subsequent local changes with `vercel deploy --prod --scope randomzzguys-projects`. GitHub repository integration is connected; local edits must be committed and pushed before Git-based deployments will contain them. The custom domain is connected to Vercel; see `DEPLOYMENT.md` for release and domain checks.

The form retains the original website's public Web3Forms access key and hCaptcha integration. It only reports success when the API confirms success, retains messages on errors, and provides email and WhatsApp alternatives. No secrets or backend environment variables are required. The public access key is intended for browser forms. Automated browser QA must intercept submissions rather than send real enquiries.

The original one-file website has been replaced by generated routes; use the commands above instead of opening an index file directly.

The current build contains 20 pages and 12 project stories. The homepage project rail features six interleaved projects and supports native touch/trackpad scrolling, previous/next buttons and arrow keys, Home and End when focused. It does not auto-rotate. Industrial and desktop previews are labelled interface studies with illustrative content, not live connections to source applications. Private operational and family records are never bundled. Motion honors the operating-system preference and the site's pause control.

The current visual system uses Barlow Condensed headlines, Outfit body text, square edges and broad coral, cream and peach sections. The original logo, warm charcoal background, coral palette and moving grid/rain remain. All 20 page layouts were rebuilt around short, direct copy and larger project presentations.

Animation checks: `python scripts/motion-smoke.py` verifies scroll reveals, hover movement, accordion reversals, motion preferences and cleanup in Chromium against the local server. See `MOTION.md` for the upstream references and behavior.

## Search and agent-readable content

`npm run build` generates 20 HTML pages, 19 Markdown alternates, `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt`. The sitemap contains the 19 indexable HTML URLs. The 404 is noindex; Markdown alternatives are marked noindex in Vercel so HTML is the search destination. Agents can still fetch the public Markdown files.

Business identity, page metadata and project titles live in `content/site.mjs`. Capabilities and industries use `content/site-copy.mjs`; all project references use the same JSON files as the portfolio. No fixed package/pricing offers, invented ratings or outcome metrics are added to schema. See `SEO_AUDIT.md` for the audit and validation scope. Edit sources, then rebuild; do not hand-edit generated discovery files in `dist/`.
