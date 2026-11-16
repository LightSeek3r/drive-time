# Changelog

All notable changes to Drive Time are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org) loosely while the project is 0.x.

## [Unreleased]

### Fixed

- The release workflow now extracts the changelog section without a regular expression, and
  Dependabot leaves major version bumps to deliberate upgrades.

## [0.7.0] - 2026-11-16

First public release.

### Added

- Public repository files: MIT licence, README with screenshots, changelog, contributing guide,
  security policy, code of conduct, issue and pull request templates, Dependabot, and a CI
  workflow that type-checks, tests, builds and checks formatting on every push.
- A release workflow that publishes a GitHub release from the matching changelog section when a
  `v*` tag is pushed.

### Changed

- The package is named `drive-time` and the Worker route is only `drive-time.unit42.fr`; the former
  `home-timer.unit42.fr` host is no longer attached.
- `PRODUCT.md` describes the Worker proxy instead of a user-supplied key.

## [0.6.0] - 2026-11-15

### Added

- Look-ahead (2, 3 or 4 hours) and step (5, 10, 15 or 30 minutes) in Settings, defaulting to 3
  hours every 10 minutes, capped at 25 rows.
- Live-traffic adjustment: rows are rescaled by the ratio of live to typical travel time, fading
  over about an hour, and the footer says when it is on.
- Tap a row to restart the list at that time, sticky column labels and Refresh, a "Go to best
  time" link, and a refresh when you return to the tab after more than 5 minutes.

### Changed

- The app is renamed Drive Time (it was Home Timer): UI, manifest, page metadata, social image,
  sitemap and robots.
- The answer, legend and footer reserve their height so nothing shifts when the best time
  appears, and the BEST and PEAK tags stay off the Min column.

## [0.5.0] - 2026-11-11

### Added

- Edit a saved Home or Work from the place shortcut list: a pencil button (or ArrowRight) reopens
  the search dialog titled "Change Home".

### Changed

- The traffic overhang animates in instead of flashing, and bars ease to the new shared scale when
  a slower trip arrives.

## [0.4.0] - 2026-11-11

### Changed

- Redesign with the Tarmac palette: neutral near-black, acid lime for actions and the best slot,
  red for the minutes traffic adds. Light theme follows the system.
- New type: Instrument Serif for the wordmark, answer and sheet titles, Schibsted Grotesk for the
  rest.
- Home and Work moved into the From and To dropdowns.
- "Leave at" opens a styled picker (day strip, hour and minute columns, past times disabled)
  instead of the native `datetime-local` input.

### Added

- New favicon, app and maskable icons, manifest colours, SEO metadata, social preview image,
  `robots.txt` and `sitemap.xml`.

## [0.3.0] - 2026-11-11

### Changed

- TomTom calls go through the Worker, so the API key is a Worker secret and never reaches the
  browser. The proxy forwards only the two calls the app makes, requires same-origin browser
  requests and rate limits per IP.
- Sample data shows until both places are chosen, instead of until a key is set.
- A bad or missing key now shows one "service unavailable" error with a retry action.

### Removed

- The API key field in Settings and its on-device storage.

## [0.2.0] - 2026-11-11

### Added

- Deployment to Cloudflare Workers with static assets and a custom domain, a `deploy` script and
  Workers Builds instructions.

## [0.1.0] - 2026-11-10

### Added

- Installable PWA that compares car travel time for nine departure times (a start time, then every
  15 minutes for two hours) using TomTom Routing with a future `departAt`, and calls out the best
  time to leave.
- Origin from device location or place search, destination search, Home and Work saved on the
  device, and a "Now" or "Leave at" start time.
- Night-first UI with cased road bars and an automatic light theme, in English and French.
- Paced, cached requests that fit the TomTom free tier.

[Unreleased]: https://github.com/LightSeek3r/drive-time/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/LightSeek3r/drive-time/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/LightSeek3r/drive-time/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/LightSeek3r/drive-time/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/LightSeek3r/drive-time/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/LightSeek3r/drive-time/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/LightSeek3r/drive-time/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/LightSeek3r/drive-time/releases/tag/v0.1.0
