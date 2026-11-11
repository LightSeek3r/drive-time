# Home Timer

When should I leave? Pick where you start and where you are going, and see the car travel time for nine departure times side by side: your start time, then every 15 minutes for two hours. The fastest one is called out.

Installable PWA, English and French, no backend. Home and Work, your API key and your last trip are stored in the browser only.

## How it works

Travel times come from the [TomTom Routing API](https://developer.tomtom.com/) with `departAt`, which blends typical traffic for that weekday and time of day with live traffic when the departure is close. Waze has no public API, and no routing service gives predictive traffic without a key.

1. Create a free TomTom key (20,000 routing and 20,000 geocoding requests per month, no card required).
2. Open Settings in the app and paste the key. Restrict it to your site's domain in the TomTom developer portal, because a key used from a browser is visible to anyone who opens the network tab.
3. Without a key the app shows clearly labelled sample data.

Each refresh makes about 9 routing requests. Results are cached for 5 minutes and refreshing is manual.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run typecheck
npm run build      # production build and service worker
npm run preview    # serve the build on http://localhost:4173
npm run icons      # regenerate PNG icons from public/icons/icon.svg
```

Geolocation and service workers need HTTPS in production (localhost is exempt). Any static host works.

## Deploy

Hosted as a Cloudflare Worker with static assets (`wrangler.jsonc`), served on `home-timer.unit42.fr`. The custom domain is created by `wrangler deploy` as long as the `unit42.fr` zone is in the same Cloudflare account.

Push-to-deploy uses Workers Builds. In the dashboard: Workers & Pages, Create application, GitHub, pick this repo, then set:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

The Worker name in the dashboard must stay `home-timer` to match `wrangler.jsonc`. Manual deploy: `npm run deploy`.

## Layout

- `src/domain` pure logic: departure slots, summary, RFC 3339 times, sample data
- `src/providers` the `TrafficProvider` seam, the TomTom client, and the throttled, cached estimate stream
- `src/storage`, `src/hooks` versioned localStorage stores and React hooks
- `src/components`, `src/styles` the UI and design tokens (night theme with automatic light theme)
- `src/i18n` English and French strings; a test keeps the two in step
- `PRODUCT.md`, `DESIGN.md` product and design context

## Known limits

- Predictions are estimates from typical traffic, not guarantees.
- The furthest future date TomTom accepts for a chosen start time has not been verified with a real key.
