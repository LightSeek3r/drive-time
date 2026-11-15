# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React 19 + TypeScript, installable PWA (vite-plugin-pwa), static hosting, no backend.

## Users

One driver (the owner, plus anyone they share the link with) who drives between a few known places (home, work) and the odd one-off destination. They open it on a phone, often to plan a commute ahead of time at a desk or the evening before, sometimes for a one-off trip, and sometimes to look at a time later in the day or week. Bilingual: English and French.

## Product Purpose

Answer "when should I leave?" by showing how long a car trip takes for a series of departure times (a start time, then +15, +30, +45 … minutes), so the user can pick the time that avoids the worst traffic. Success: the user reads the best departure time and the minutes it saves in one glance, without opening a map app.

## Positioning

Waze/Google Maps hide departure-time comparison inside route screens, one time at a time. This tool puts the departure-time comparison itself on the first screen and nothing else: origin, destination, a start time, and the list of times side by side.

## Operating Context

Origin comes from the device's location or a typed place. Destination is typed or a saved place. Home and Work are saved on the device (localStorage). Travel times come from TomTom Routing (`departAt`), which blends historic typical speeds for that weekday and time with current traffic. The user supplies their own free TomTom API key in Settings; it is stored on the device only.

## Capabilities and Constraints

- Origin: current location (geolocation) or place search with autocomplete. Destination: place search or saved Home/Work. Swap origin and destination.
- Start time: "now" by default, or a chosen day and time ("leave at…"). Results: base time and the following steps, 10 minutes for 3 hours by default (19 slots); Settings offer 2, 3 or 4 hours and 5, 10, 15 or 30 minutes, capped at 25 slots. Each slot shows departure time, arrival time, duration, and difference from the first slot. The fastest slot is called out.
- Save and edit Home and Work in localStorage. No accounts, no server, no analytics.
- Free TomTom tier: 20K routing and 20K geocoding requests/month, no card; one routing request per slot per refresh (19 by default), so results are cached for 5 minutes and refresh is manual.
- Predictions are estimates from typical traffic, not guarantees; the copy must not oversell them.
- Open decision: maximum future date the routing API accepts for a chosen start time (to be verified live; the picker limits itself to what the API accepts).
- Open decision: whether Mapbox is added later as a second provider (not in v1).

## Brand Commitments

Name: Home Timer. UI languages: English and French, auto-detected, switchable in Settings.

## Evidence on Hand

None. No real traffic data, screenshots, or testimonials exist yet. Demonstration data must be labelled as sample data; no claims about accuracy versus Waze or Google Maps.

## Product Principles

1. The answer first: the best departure time and minutes saved lead the screen; configuration stays out of the way once set.
2. Honest about uncertainty: every figure is an estimate and says so plainly.
3. Fast for the repeat case: Home and Work are one tap; a repeat visit needs no typing.
4. Private by default: places, key, and history stay on the device.
5. Works at the door and at the desk: one-handed on a phone, comfortable on a desktop.

## Accessibility & Inclusion

WCAG 2.2 AA: 44 px touch targets, keyboard-operable combobox and time picker, results announced to screen readers, reduced-motion respected, no meaning carried by color alone (the fastest slot is marked by text and shape, not just hue). Times and dates follow the device locale.
