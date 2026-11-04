# Website content and discovery audit — 5 November 2026

The current site represents Zencode Software Labs as a Malaysia-based design and software studio working across websites, custom software, AI and workflow automation, and digital products. The portfolio contains 12 project stories, including client work, independent products, prototypes and research; it is not a count of clients.

## Updated

- Central business identity in `content/site.mjs`: Zencode Software Labs, SSM `202503314028 (LA0084002-U)`, canonical domain, contact channels, founder portfolio and broad service description.
- Unique, descriptive search and social titles/descriptions for all 20 HTML pages. The visual headlines remain independent of descriptive search titles.
- Canonical URLs, Open Graph/Twitter fields, image descriptions, actual image dimensions and project-specific previews. Industrial and desktop interface studies have static sharing assets with illustrative labels.
- Organization/WebSite/WebPage structured data, business registration identifier, founder reference, breadcrumbs, a 12-project collection, a four-service list and industry references. No invented ratings, customer counts, revenue, guarantees, offers or prices.
- Generated `robots.txt` and a sitemap containing all 19 indexable canonical pages, excluding the 404. Filter/search URLs canonicalize to the work collection.
- Generated `llms.txt`, `llms-full.txt` and 19 Markdown versions of public pages. They reuse service/project content and retain project-stage and evidence limitations. Form implementation fields and private source notes are excluded.
- Standard `describedby` and Markdown `alternate` links in the document head. Markdown variants are readable by agents and marked `noindex` to keep HTML as the search destination; HTML remains indexable.
- Web-app manifest naming/description, production documentation and the obsolete optimizer’s hard-coded path.
- TapRepute’s summary describes QR/shared-link access, matching the supplied cardless dashboard rather than presenting NFC as an already available entry point.

## Validation

`npm run check` validates headings, local links/assets, unique metadata, social image references, canonical URLs, JSON-LD, business identity, breadcrumbs, project coverage, sitemap completeness and Markdown/LLM references. It rejects private implementation paths or form fields in the LLM documents. Browser smoke tests cover rendering and core interactions without sending enquiries.

Live verification on `https://zencode.my` passed for all 19 canonical HTML/Markdown pairs, social metadata, UTF-8 content types, Markdown noindex headers, robots/sitemap/LLM files and genuine 404 responses. The 60 responsive browser route checks and core interaction tests passed. The `www` domain now returns a permanent 308 redirect to the canonical root domain, preserving paths and query strings. External project websites and the founder portfolio returned successful responses.

## Maintaining it

Edit business details in `content/site.mjs`; services/industries in `content/site-copy.mjs`; project stories in the two project JSON files. Build and check again. Discovery files are generated in `dist/`, so do not edit that output by hand. New projects need a public cover or interface-study sharing asset and a descriptive title in `projectTitles`.

LLM documents provide public reference material; they do not enforce crawler permissions or guarantee search/AI placement. Search Console sitemap submission and search-engine recrawling are external to a website deployment. No external indexing submission is performed by the build.

## References used

- [Google: descriptive page metadata and crawlable content](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [llms.txt proposal and Markdown discovery conventions](https://llmstxt.org/)
