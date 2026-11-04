# Vercel deployment and domain handover

The rebuilt site is deployed at https://zencode-website.vercel.app in the owner's existing Vercel account, project `zencode-website`. Source changes remain in this local checkout; no Git commit or push was performed.

`zencode.my` is attached to the project, but its Porkbun DNS still points to GitHub Pages. The current live custom-domain website therefore remains unchanged until DNS is updated.

## Porkbun DNS change

Vercel's domain verification returned these recommended records during this task:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | 7c0e9ce73fc34055.vercel-dns-017.com |

Replace the existing root A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153` with the two recommended A records above. Configure `www` with the CNAME shown. Preserve mail/MX/TXT records and unrelated subdomains. There is no need to move the domain registration or nameservers. The app redirects `www.zencode.my` to the canonical `zencode.my` address.

Re-check recommendations in Vercel before making a future DNS change, since provider values can change:

```sh
vercel domains verify zencode.my --scope randomzzguys-projects
vercel domains verify www.zencode.my --scope randomzzguys-projects
```

Once DNS has propagated, verify HTTPS and the home, work and contact pages on the custom domain. The existing Web3Forms key was retained. Form success and failure behavior was tested using intercepted local responses; the real hCaptcha widget loads on the deployed site. No live test enquiry was sent, so end-to-end mailbox delivery remains a manual check.
