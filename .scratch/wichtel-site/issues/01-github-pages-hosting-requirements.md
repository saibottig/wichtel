# GitHub Pages hosting requirements

Type: research
Status: resolved

## Question

What is required to serve this site from GitHub Pages at the custom subdomain `wichtel.turbodev.eu`?
Cover the DNS record, the repository requirements, HTTPS, and the order of operations.

## Answer

**The DNS record is a CNAME, and it goes at Cloudflare, not Checkdomain.**
The nameservers for `turbodev.eu` are `aiden.ns.cloudflare.com` and `dorthy.ns.cloudflare.com`, confirmed by an NS lookup.
Checkdomain is the registrar, but Cloudflare is authoritative for DNS, so a record added in the Checkdomain panel would have no effect.

**The subdomain does not exist yet.**
`wichtel.turbodev.eu` returns NXDOMAIN for both CNAME and A.
Nothing has been created for it so far.

**The record must be `wichtel` CNAME to `saibottig.github.io`.**
GitHub's docs are explicit that the target excludes the repository name, so `saibottig.github.io/wichtel` is wrong.
Pointing it at the apex `turbodev.eu` is also wrong and breaks HTTPS enforcement.

**It must not be proxied through Cloudflare.**
The apex resolves to `104.21.30.33` and `172.67.150.118`, which are Cloudflare proxy addresses, so the zone is in use with proxying on at least one record.
If the new record is proxied, GitHub's automatic DNS check sees Cloudflare addresses rather than its own and certificate issuance stalls.
Set it to DNS only.

**The repository must be public, or the account must be on GitHub Pro.**
Pages does not publish from a private repository on a free account.
Worth recording: a private repository does not produce a private site, because published Pages sites are public on the internet either way.
The repository has since been made public and Pages has been enabled.

**HTTPS is not immediate.**
The certificate is requested only after GitHub's DNS check passes.
Expect up to an hour for the site to answer over HTTPS, and up to 24 hours before the Enforce HTTPS checkbox unlocks.
An error reading that the domain does not resolve to the GitHub Pages server is the expected state until DNS propagates, not a failure.

**Order of operations matters.**
The custom domain goes into the repository settings first, then the DNS record.
Doing it the other way round opens a window where someone else can claim the subdomain.
This ordering is already satisfied, since the custom domain was set before any record exists.

Sources are GitHub's published documentation for configuring a custom domain, managing a custom domain, securing a site with HTTPS, and configuring a publishing source.
DNS findings are from direct lookups run in this session.
