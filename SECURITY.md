# Security policy

## Supported versions

Only the latest release, served on [drive-time.unit42.fr](https://drive-time.unit42.fr/), receives
fixes.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting instead:
[Report a vulnerability](https://github.com/LightSeek3r/drive-time/security/advisories/new).

Include what you found, how to reproduce it and what you think the impact is. You can expect an
acknowledgement within a few days. Once a fix is released the advisory is published and you are
credited, unless you prefer otherwise.

## Scope

Of most interest:

- Anything that exposes or lets a third party spend the TomTom API key held by the Worker
  ([`worker/`](worker)): bypassing the endpoint allow-list, the same-origin check or the rate limit.
- Cross-site scripting or injection in the app.
- Data leaving the device that should stay on it. Places and settings are stored in the browser only.

Out of scope: findings that need a compromised device, volumetric denial of service, and
inaccuracies in travel time predictions, which are estimates from TomTom.
