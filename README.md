# Drive Time

When should I leave? Pick where you start and where you are going, and see the car travel time for a list of departure times side by side: your start time, then one departure every 10 minutes for three hours (19 rows). Settings change the reach (2, 3 or 4 hours) and the step (5, 10, 15 or 30 minutes), up to 25 rows. The fastest one is called out. Tap a row to restart the list at that time.

Installable PWA, English and French. Home and Work and your last trip are stored in the browser only. The app shows sample data until you choose a start and a destination.

## How it works

Travel times come from the [TomTom Routing API](https://developer.tomtom.com/) with `departAt`, which blends typical traffic for that weekday and time of day with live traffic when the departure is close. Waze has no public API, and no routing service gives predictive traffic without a key.

The TomTom key never reaches the browser. The app calls its own `/api/*` routes, and a small Worker (`worker/`) adds the key as a secret before forwarding to TomTom. It only forwards the two calls the app makes, accepts same-origin browser requests, and rate limits per IP (60 requests per minute), so the key cannot be spent on anything else.

1. Create a free TomTom key (20,000 routing and 20,000 geocoding requests per month, no card required).
2. Store it as a Worker secret named `TOMTOM_API_KEY` (dashboard: Worker, Settings, Variables and Secrets, type Secret; or `npx wrangler secret put TOMTOM_API_KEY`). Without it `/api/*` answers 503 and the app shows a "service unavailable" message.
3. For local development put `TOMTOM_API_KEY=...` in a gitignored `.dev.vars` file and run `npx wrangler dev` after `npm run build`; `npm run dev` serves the UI only.

Each refresh makes one routing request per row (19 with the default window, 25 at most; Settings shows the count). Results are cached for 5 minutes. Refresh is manual, plus an automatic one when you come back to the tab after more than 5 minutes.

### Live traffic adjustment

TomTom returns, for each departure, the typical duration (`historicTrafficTravelTimeInSeconds`) and a duration from real-time speeds (`liveTrafficIncidentsTravelTimeInSeconds`). When the first departure is within 10 minutes of the request, the app takes `live / typical` (clamped to 0.7 to 2.5) and applies it to every row's typical duration, fading with `exp(-minutes ahead / 60)`. Rows start from the typical figure, not from TomTom's own blend, so a jam is not counted twice. The footer says when this is on ("Adjusted for live traffic (+7 min)", the minutes live traffic adds to the first departure). The logic is in `src/domain/calibration.ts`; the 60-minute decay is a guess to tune with real data.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173 (UI only, /api/* is not served)
npm test           # Vitest
npm run typecheck
npm run build      # production build and service worker
npm run preview    # serve the build on http://localhost:4173
npm run icons      # regenerate PNG icons from public/icons/icon.svg
```

Geolocation and service workers need HTTPS in production (localhost is exempt). Any static host works.

## Deploy

Hosted as a Cloudflare Worker with static assets (`wrangler.jsonc`), served on `drive-time.unit42.fr`. The custom domain is created by `wrangler deploy` as long as the `unit42.fr` zone is in the same Cloudflare account. The former host `home-timer.unit42.fr` stays attached to the same Worker so old links and installed copies keep working; browser storage is per host, so Home and Work saved there are not shared with the new one. The Worker keeps its original name `home-timer`.

Push-to-deploy uses Workers Builds. In the dashboard: Workers & Pages, Create application, GitHub, pick this repo, then set:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

The Worker name in the dashboard must stay `home-timer` to match `wrangler.jsonc`. `wrangler.jsonc` also declares the rate limit binding; if its `namespace_id` is already used by another Worker in the account, change it. Manual deploy: `npm run deploy`.

## Layout

- `src/domain` pure logic: departure slots and window, summary, live-traffic calibration, RFC 3339 times, sample data
- `src/providers` the `TrafficProvider` seam, the TomTom client (calls `/api/*`), and the throttled, cached estimate stream
- `worker` the Cloudflare Worker that proxies `/api/*` to TomTom with the secret key
- `src/storage`, `src/hooks` versioned localStorage stores and React hooks
- `src/components`, `src/styles` the UI and design tokens (night theme with automatic light theme)
- `src/i18n` English and French strings; a test keeps the two in step
- `PRODUCT.md`, `DESIGN.md` product and design context

## Known limits

- Predictions are estimates from typical traffic, not guarantees. The live adjustment is a heuristic, and the `historic`/`live` fields were only checked against a hand-written fixture, not a real TomTom response.
- The furthest future date TomTom accepts for a chosen start time has not been verified with a real key.
