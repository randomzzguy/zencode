# Production hosting

Canonical website: https://zencode.my. Vercel project: `randomzzguys-projects/zencode-website`. The secondary address, https://zencode-website.vercel.app, remains available for review; page canonicals point to the custom domain.

The domain migration to Vercel is complete. On 5 November 2026, the root domain resolved to Vercel and both custom hostnames served the rebuilt site over HTTPS. DNS is managed at Porkbun. Use current Vercel Domains settings for any future DNS changes; do not reuse historical setup records without checking. Preserve email records and unrelated subdomains.

The preferred URL is the root domain without `www`. The configuration includes a permanent redirect from `www.zencode.my`, with matching canonical URLs in HTML, structured data, the sitemap and LLM references.

## Build and deploy

```sh
npm ci
npm run build
npm run check
vercel deploy --prod --yes --scope randomzzguys-projects
```

Vercel installs dependencies and serves `dist/`. Commit and push source changes when ready; a manual deployment does not create a Git commit. Git-based Vercel deployments use the connected repository. The existing GitHub Pages workflow can still build the static output, but Vercel is the production host for the custom domain.

## Release verification

- Check HTTPS, the preferred hostname, navigation, project pages and unknown-page 404 responses.
- Check `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` and `/index.md`.
- Confirm Markdown documents use `text/markdown` and HTML remains indexable.
- Run metadata/link checks and browser smoke tests before release.
- Real mailbox delivery is a separate manual check: automated enquiry tests intercept submissions and do not send messages.

No private environment files, source databases, family reports or authenticated project records belong in `dist/`. `.env*`, `.vercel/`, scratch previews and private provenance notes are excluded from deployment inputs.
