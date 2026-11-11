---
name: Home Timer
description: A night-first departure comparison in neutral tarmac grey, where pale grey bars show the trip, red shows the minutes traffic adds, and one acid lime marks everything you can act on.
colors:
  ground: '#101010'
  surface: '#181818'
  raised: '#212121'
  hairline: '#2e2e2e'
  ink: '#f0f0f0'
  muted: '#9a9a9a'
  action: '#c6f432'
  on-action: '#101010'
  cost: '#ff3b30'
  on-cost: '#101010'
  road: '#cfcfcf'
  ground-day: '#f5f5f3'
  surface-day: '#ebebe8'
  raised-day: '#e0e0dc'
  hairline-day: '#d0d0cb'
  ink-day: '#111111'
  muted-day: '#666666'
  action-day: '#111111'
  on-action-day: '#ffffff'
  cost-day: '#d92c20'
  on-cost-day: '#ffffff'
  road-day: '#3a3a3a'
typography:
  display:
    fontFamily: "'Instrument Serif', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
    fontSize: 'clamp(40px, 12.5vw, 52px)'
    fontWeight: 400
    lineHeight: 1
    letterSpacing: '-0.01em'
  display-wide:
    fontFamily: "'Instrument Serif', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
    fontSize: 'clamp(52px, 4.6vw, 68px)'
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "'Instrument Serif', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
    fontSize: '28px'
    fontWeight: 400
  brand:
    fontFamily: "'Instrument Serif', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
    fontSize: '24px'
    fontWeight: 400
  figure-leave:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 650
    fontFeature: "'lnum'"
  figure-minutes:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '15px'
    fontWeight: 750
    fontFeature: "'tnum', 'lnum'"
  body:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.35
    fontFeature: "'lnum'"
  body-sm:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '12px'
    fontWeight: 500
    lineHeight: 1.2
  tag:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', system-ui, sans-serif"
    fontSize: '10px'
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: '0.06em'
rounded:
  bar: '3px'
  tag: '4px'
  field: '14px'
  sheet: '20px'
  pill: '999px'
spacing:
  space-1: '4px'
  space-2: '8px'
  space-3: '12px'
  space-4: '16px'
  space-5: '24px'
  space-6: '32px'
  touch: '44px'
  row-height: '38px'
  row-height-wide: '44px'
components:
  button-primary:
    backgroundColor: '{colors.action}'
    textColor: '{colors.on-action}'
    rounded: '{rounded.pill}'
    height: '{spacing.touch}'
    padding: '0 24px'
  button-primary-disabled:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.muted}'
    rounded: '{rounded.pill}'
  button-quiet:
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    height: '{spacing.touch}'
    padding: '0 24px'
  segment-active:
    backgroundColor: '{colors.action}'
    textColor: '{colors.on-action}'
    rounded: '{rounded.pill}'
    padding: '0 16px'
  segment-idle:
    textColor: '{colors.muted}'
    rounded: '{rounded.pill}'
    padding: '0 16px'
  time-button:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    height: '{spacing.touch}'
    padding: '0 16px'
  place-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    height: '52px'
    padding: '0 4px 0 16px'
  place-option:
    textColor: '{colors.ink}'
    rounded: '10px'
    height: '{spacing.touch}'
    padding: '8px 12px'
  day-chip:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.muted}'
    rounded: '{rounded.field}'
    padding: '8px 12px'
  day-chip-selected:
    backgroundColor: '{colors.action}'
    textColor: '{colors.on-action}'
    rounded: '{rounded.field}'
  time-entry-selected:
    backgroundColor: '{colors.action}'
    textColor: '{colors.on-action}'
    height: '{spacing.touch}'
  tag-sample:
    textColor: '{colors.muted}'
    rounded: '{rounded.tag}'
    padding: '1px 6px'
  tag-best:
    backgroundColor: '{colors.action}'
    textColor: '{colors.on-action}'
    rounded: '{rounded.tag}'
    typography: '{typography.tag}'
    padding: '1px 5px'
  tag-peak:
    backgroundColor: '{colors.cost}'
    textColor: '{colors.on-cost}'
    rounded: '{rounded.tag}'
    typography: '{typography.tag}'
    padding: '1px 5px'
  results-row:
    height: '{spacing.row-height}'
    textColor: '{colors.ink}'
  road-trip:
    backgroundColor: '{colors.road}'
    height: '10px'
  road-over:
    backgroundColor: '{colors.cost}'
    textColor: '{colors.on-cost}'
    height: '10px'
  banner:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    height: '48px'
    padding: '4px 16px'
  sheet:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.sheet}'
---

# Design System: Home Timer

## Overview

**Creative North Star: "Tarmac"**

Home Timer is read at the door, in the car, or at a dim desk before dawn, so it is night-first: a true neutral near-black ground (#101010) with no warm or blue cast, like a road at night. Colour is rationed to two signals that carry meaning and nothing else competes with them: **acid lime** is everything you can act on or should take (focus, the active choice, the primary action, the best slot), and **traffic red** is the minutes traffic adds. The trip itself is a pale grey bar, so a driver reads the length first and the cost second.

The type has a human voice. Instrument Serif sets only the wordmark, the sheet titles and the answer ("Leave 7:04 PM", the time in lime); everything else, including every figure a driver compares, is Schibsted Grotesk. There is no width axis and no mixed display faces. Copy is plain and admits uncertainty ("Estimated from typical traffic", a SAMPLE DATA tag until real places are set).

The screen divides by tone, not by outlines: one `surface` step for fields, the time controls and notices, one `raised` step for hover, focus and popovers, and 1px hairlines only between result rows. The system rejects the blue-pin maps look, the neon-glow dashboard (no glow anywhere), and warm cream-and-orange app palettes. A daylight theme follows `prefers-color-scheme`: paper white and near-black, where the action colour becomes black because lime cannot carry text on light.

**Key Characteristics:**

- Neutral near-black ground, two tonal steps above it (`surface`, `raised`), hairlines only between rows.
- Colour means something: lime = act or best, red = traffic cost, grey = the trip. Nothing decorative.
- Flat 10px road bars on one shared scale, 3px radius, no casing and no glow.
- Serif for voice (wordmark, answer, sheet titles), grotesque for everything read or compared.
- Saved places live inside the From/To dropdown; nothing stays "selected" after you use it.
- Colour never carries meaning alone: BEST and PEAK are words, SAMPLE DATA is a word.

## Colors

### Primary

- **Acid Lime** (`colors.action`, #c6f432): focus ring, the active segment, the primary button, the selected day and time in the picker, text links (Refresh, Save as), the locate icon, BEST (tag, underline, faster delta) and the departure time in the answer. Text on lime is `on-action` (#101010).

### Secondary

- **Traffic Red** (`colors.cost`, #ff3b30): minutes traffic adds only: the bar overhang, positive deltas, the PEAK tag, and the error banner icon. Text on red is `on-cost` (#101010).
- **Road Grey** (`colors.road`, #cfcfcf): the trip at its fastest, drawn as the base of every road bar and the first legend swatch, and the road mark in the brand band.

### Neutral

- **Tarmac Ground** (`colors.ground`, #101010): page background.
- **Surface** (`colors.surface`, #181818): the From/To block, the When controls, notice banners, sheets.
- **Raised** (`colors.raised`, #212121): hover and focus fill for fields, popovers, day chips and the time columns in the picker, disabled primary fill.
- **Hairline** (`colors.hairline`, #2e2e2e): row dividers, the divider between From and To, quiet button borders, scrollbars.
- **Ink** (`colors.ink`, #f0f0f0): body and figure text.
- **Muted** (`colors.muted`, #9a9a9a): labels, placeholders, secondary figures, idle segments, rest-state icons.

Derived values live in `src/styles/tokens.css`: best-row tint `rgb(198 244 50 / 0.08)`, hover tint `rgb(240 240 240 / 0.06)`, sheet scrim `rgb(0 0 0 / 0.72)`, skeleton highlight `rgb(240 240 240 / 0.16)`.

### Light theme mapping

Applied under `@media (prefers-color-scheme: light)` by redefining the same custom properties. Ground becomes `ground-day` #f5f5f3, surface #ebebe8, raised #e0e0dc, hairline #d0d0cb, ink #111111, muted #666666. The action colour becomes black (#111111) with white text, because lime has no contrast on light; red darkens to #d92c20 with white text; the road grey darkens to #3a3a3a. The scrim becomes `rgb(17 17 17 / 0.45)`. `color-scheme` and the two `theme-color` meta tags (#101010 dark, #F5F5F3 light) follow the same switch. There is no manual theme toggle.

### Named Rules

**The Meaning Rule.** Action means act or best, cost means traffic, road means the trip. No hue is used for decoration, and none is added without a meaning.

**The Words-Not-Hues Rule.** The fastest and worst slots are marked by the words BEST and PEAK and by shape (underline, tag), in addition to colour.

## Typography

**Voice font:** Instrument Serif (400), loaded from `@fontsource/instrument-serif`. **UI and figures font:** Schibsted Grotesk Variable, loaded from `@fontsource-variable/schibsted-grotesk`. Both are self-hosted so the PWA works offline.

**Character:** The serif gives the answer and the wordmark a printed, human tone against the dark ground; the grotesque keeps the dense result grid crisp.

### Hierarchy

- **Display** (Instrument Serif, `clamp(40px, 12.5vw, 52px)`, line-height 1): "Leave 7:04 PM", the time in lime. `clamp(52px, 4.6vw, 68px)` at 900px and up.
- **Title** (Instrument Serif, 28px): sheet and dialog titles, and the live preview line in the time picker. **Brand** is the same face at 24px.
- **Figure** (Schibsted Grotesk): leave time 650 at 16px, minutes 750 at 15px, both lining figures; minutes and delta are also tabular so digits stack.
- **Body** (400, 15px, line-height 1.35, lining figures): inputs, comparison lines, bold figures at 650.
- **Body small** (13px arrive, delta, hints; 14px banners and buttons): secondary text.
- **Label** (500, 12px): column heads, legend, picker column names (13px).
- **Tag** (800, 10px, letter-spacing 0.06em): BEST and PEAK. SAMPLE DATA is 700 at 11px with 0.04em tracking.

### Named Rules

**The Tabular Where It Stacks Rule.** Tabular figures are set only on the minutes and delta columns. Schibsted widens colons and punctuation under `tnum`, so clock times and sentences stay on proportional lining figures.

**The One Serif Rule.** Serif is for the wordmark, the answer, sheet titles and the picker preview, and the picker's day numbers. Never for data columns, labels or buttons.

## Layout

**Spacing scale:** 4, 8, 12, 16, 24, 32 px (`space-1` to `space-6`).

**Mobile (below 900px):** a single column, full width up to 480px, centred. Order: brand band (56px, no divider), optional notice banners, the From/To block with swap, the When row, the answer, legend and result rows, footer. Horizontal page padding is 16px. Touch targets are 44px. Result rows are 38px with 1px hairline tops. Safe-area insets are respected on the shell, footer and sheets.

**Wide (900px and up):** the frame becomes up to 1100px wide with hairline borders on both inline edges, and `main` is a two-column grid: controls and answer on the left at 460px (sticky), results on the right up to 640px. Rows grow to 44px. Sheets become a centred 440px dialog with a 20px radius.

**Small phones (440px and below):** the When segments tighten (12px padding, 13px text) and the time button drops its clock icon.

**Results grid:** five columns share one table grid: Leave (left), Duration (the bar, remaining width, minimum 80px), Min (right), Arrive (right, muted), delta versus the first slot (right). All bars share one track scale.

**Rhythm:** the first viewport at 390 by 844 holds the controls, the answer and all nine rows without scrolling.

## Elevation & Depth

Flat. There are no shadows, no glow and no outlines for resting controls. Depth is one tonal step per layer: ground, then `surface`, then `raised` for what is hovered, focused or floating. A sheet is separated from the page by the scrim.

### Named Rules

**The Flat Rule.** No `box-shadow` anywhere. Hover and focus raise a control one tonal step; popovers use `raised` plus a 1px hairline.

## Shapes

Controls are pills (999px): buttons, the segmented control, the time button, the swap and locate buttons, round icon buttons. Fields, day chips, picker columns and popovers are 14px rounded blocks; the From and To rows form one block (top row rounds its top corners, bottom row its bottom corners). Options inside a popover are 10px. Road bars have 3px radius ends; the trip and overhang butt together with no gap. Tags are 4px. Sheets are 20px (top corners only on mobile). The route rail uses a hollow circle for From, a filled rounded square for To, and a dotted vertical line between them. The brand mark is a 26 by 12 miniature of a bar: a grey trip block and an red overhang.

## Components

### Brand band

56px band, no divider: the road mark and "Home Timer" in Brand (Instrument Serif 24px) on the left, a 44px round settings button in muted on the right (`raised`-tint hover).

### Route block, swap and locate

- **Block:** two 52px rows (From above, To below) on `surface`, sharing one 14px-radius block with a hairline divider inset from the rail. The rail carries a 12px marker per row; the visible From/To text labels are replaced by visually hidden labels.
- **Row states:** hover fills `raised`; focus-within also draws a 2px lime outline inset on the row and hides the rail line.
- **Locate:** a 44px round lime icon button inside the From row (muted when disabled, spinning while locating).
- **Swap:** a 44px round `surface` button in a second grid column; it turns 180 degrees while pressed.

### Place dropdown

The From and To inputs are an ARIA combobox. Focused with nothing typed, the popover lists the saved places: **Home** and **Work** with a 32px icon disc, the label (600) and the address (13px muted). An unset place reads "Set Home" with a dashed disc and a plus, and opens the set-up dialog. Typing swaps the list for search results. Choosing an entry fills only the field it was opened from, closes the list and blurs the input; nothing keeps a selected state. The popover sits 8px below the row on `raised` with a 1px hairline and a 14px radius, 320px max height, entering with a 4px rise.

### When row and time picker

- **Segmented:** a 44px `surface` pill with 3px padding holding Now and Leave at. Idle text is muted; the checked segment fills lime with `on-action` text. Choosing Leave at opens the picker.
- **Time button:** a flex-filling 44px `surface` pill showing the day and time (14px, 650) with a pencil icon at the right; muted while the mode is Now, ink once a time is set. It opens the picker.
- **Picker sheet:** a bottom sheet on mobile, a centred dialog on wide. Title "Leave at" (Title), a close button, then a horizontally scrolling row of seven **day chips** (weekday above a serif day number; Today and Tomorrow spelled out), two scrolling **columns** (Hour in the device locale, Minute in 5-minute steps) on `raised` with 44px entries, a serif live preview ("Today, 5:15 PM"), and Cancel and Set time actions. The selected day, hour and minute fill lime. Past times today are disabled and struck through; picking a day that would put the time in the past lands on the earliest valid time. All three groups are native radio groups, so arrow keys work.

### Answer

No panel: the headline sits on the ground with 24px above and 16px below. "Leave" in ink and the time in lime (Display), an optional SAMPLE DATA tag at the right (1px muted border, 4px radius), and one or two 15px comparison lines with 650 figures. Loading shows skeleton greys (headline 62% by 44px, lines 88% and 54% by 14px) with a hairline-to-ink shimmer.

### Results table and RoadBar

- **Legend:** two 14 by 8px swatches (grey: "Trip at its fastest"; red: "Extra minutes from traffic"), 12px muted.
- **Rows:** 38px, hairline top, not selectable, no hover. Leave in 16px 650, minutes in 15px 750 tabular, arrive and delta in 13px muted (delta red for plus, lime for minus).
- **RoadBar:** a 10px-high track. Trip segment grey, overhang red, both flat; width is trip plus overage as a share of one shared scale. A bar draws in from the left (scaleX 0 to 1) over 600ms with `cubic-bezier(0.16, 1, 0.3, 1)` and a 35ms stagger.
- **PEAK:** the word sits inside the red overhang (10px 800, `on-cost`) when wide enough, else a red tag beside the bar.
- **BEST:** a full-row lime tint (0.08), a lime BEST tag beside the bar, and a 3px lime underline 6px below the bar at full bar width, drawn in with it.
- **States:** loading rows show a 60% by 10px shimmer; error rows show a muted 12px hint; spent (past) rows strike the leave time through in muted and dim the bar to 0.45.

### Banners

48px minimum height on `surface`, 16px side padding, 12px gap, 14px text with a leading icon and an optional action. Tone is carried by the icon colour only: info muted, warning lime, error red.

### Settings sheet and place dialog

A native `dialog` sheet: `surface` fill, 20px top radius, scrim behind it, rising 24px on open, anchored to the bottom on mobile (max height `min(92dvh, 720px)`) and a centred 440px dialog at 900px and up. Titles use Title (Instrument Serif 28px) with a 44px round close button. Groups stack with 24px gaps; labels are 13px 500 muted. Language is a two-option pill radio group using the segment-active pattern. A hairline-topped privacy note in 13px muted precedes right-aligned actions.

### Buttons

- **Primary:** lime pill, `on-action` text, 44px minimum height, 24px side padding, 15px 650. Hover brightens slightly; pressing scales to 0.98. Disabled is `raised` fill with muted text.
- **Quiet:** transparent pill, 1px hairline border, ink text; hover fills the hover tint and strengthens the border.
- Text-link actions (Refresh, Save as) are lime 650-700 text; Save as is underlined.

### Footer

16px side padding (24px wide), bottom padding equal to the safe-area inset, no divider. Left: "Estimated from typical traffic" in 12px muted. Right: a lime Refresh action with a 44px target and a refresh icon.

### Motion

Controls change state over 120ms (background, border and colour on hover, press and checked). Popovers enter over 220ms with a 4px rise, sheets over 220ms with a 24px rise. The bar draw-in (600ms, 35ms stagger), the skeleton shimmer (1.4s) and the locate spinner (900ms) are unchanged. Under `prefers-reduced-motion: reduce` every transition, the sheet and popover entrances, the draw-in, shimmer and spinner are disabled (`--dur-fast` and `--dur-enter` collapse to 0ms).

## Do's and Don'ts

### Do:

- **Do** keep lime for things you can act on and for the best slot, red for traffic cost, grey for the trip.
- **Do** raise by tone (`surface`, then `raised`) and separate result rows with 1px hairlines.
- **Do** set the answer, wordmark and sheet titles in Instrument Serif and everything else in Schibsted Grotesk.
- **Do** keep tabular figures to the minutes and delta columns.
- **Do** mark BEST and PEAK with words and shape as well as colour, and demo data with a visible SAMPLE DATA tag.
- **Do** keep 44px minimum touch targets and 16px mobile side padding; honour safe-area insets.
- **Do** swap tokens for light mode (same names, new values) rather than adding light-only components.
- **Do** let a shortcut act and then disappear: choosing Home or Work fills one field and leaves nothing highlighted.

### Don't:

- **Don't** add drop shadows or glow of any kind.
- **Don't** use coloured side stripes or left/right accent borders on rows, banners or panels.
- **Don't** add eyebrow labels, kickers or small-caps overlines above headings or sections.
- **Don't** use lime or red for decoration, and don't make result rows selectable.
- **Don't** set serif type in data columns, labels or buttons.
- **Don't** apply `tnum` to clock times or running text.
- **Don't** convey fastest, slowest or sample status by hue alone.
- **Don't** hard-code new colours, radii or font sizes in components when a token exists; add one-off pixel values to the tokens first.

**Known build drift, not canonized:** a few literal pixel values (52px field rows, 68px day chips, 220px picker columns, 320px popover height) and the 900px and 440px breakpoints are hard-coded in component CSS with no token. The travel-day window in the picker (7 days) is a constant until TomTom's maximum departAt is verified.
