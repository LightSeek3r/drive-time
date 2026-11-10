---
name: Home Timer
description: A night-first departure comparison where every trip is a cased road bar lit from within, amber for the fastest trip and coral for the minutes traffic adds.
colors:
  ground: '#0a0f1e'
  surface: '#111933'
  hairline: '#26325a'
  ink: '#e8edfb'
  muted: '#8b97b8'
  amber: '#ffb547'
  amber-casing: '#b8761a'
  coral: '#ff6b57'
  coral-casing: '#b2392c'
  mint: '#4fe3b0'
  cobalt: '#7c9bff'
  on-cobalt: '#0a0f1e'
  on-accent: '#0a0f1e'
  ground-day: '#f4f6fb'
  surface-day: '#ecf0f8'
  hairline-day: '#c5cde3'
  ink-day: '#131a33'
  muted-day: '#4f5b7a'
  amber-day: '#b36500'
  amber-casing-day: '#6d3f00'
  coral-day: '#b5301e'
  coral-casing-day: '#6f1c11'
  mint-day: '#066a4b'
  cobalt-day: '#3552d9'
  on-cobalt-day: '#ffffff'
  on-accent-day: '#ffffff'
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(30px, 9.4vw, 40px)'
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 118"
  display-wide:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(40px, 3.6vw, 52px)'
    fontWeight: 800
    lineHeight: 1
    letterSpacing: '-0.02em'
    fontVariation: "'wdth' 118"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '22px'
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: '-0.01em'
    fontVariation: "'wdth' 118"
  brand:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '20px'
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: '-0.01em'
    fontVariation: "'wdth' 118"
  figure-leave:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '16px'
    fontWeight: 700
    lineHeight: 1.35
    fontVariation: "'wdth' 118"
    fontFeature: "'tnum', 'lnum'"
  figure-minutes:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '15px'
    fontWeight: 800
    lineHeight: 1.35
    fontVariation: "'wdth' 118"
    fontFeature: "'tnum', 'lnum'"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.35
    fontVariation: "'wdth' 100"
    fontFeature: "'tnum', 'lnum'"
  body-sm:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '12px'
    fontWeight: 500
    lineHeight: 1.2
    fontVariation: "'wdth' 92"
  tag:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: '10px'
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: '0.06em'
    fontVariation: "'wdth' 92"
rounded:
  tag: '4px'
  field: '10px'
  sheet: '16px'
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
    backgroundColor: '{colors.cobalt}'
    textColor: '{colors.on-cobalt}'
    rounded: '{rounded.pill}'
    height: '{spacing.touch}'
    padding: '0 16px'
  button-primary-disabled:
    backgroundColor: '{colors.hairline}'
    textColor: '{colors.muted}'
    rounded: '{rounded.pill}'
  button-quiet:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    height: '{spacing.touch}'
    padding: '0 16px'
  segment-active:
    backgroundColor: '{colors.cobalt}'
    textColor: '{colors.on-cobalt}'
    rounded: '{rounded.pill}'
    padding: '0 12px'
  segment-idle:
    textColor: '{colors.muted}'
    rounded: '{rounded.pill}'
    padding: '0 12px'
  time-pill:
    textColor: '{colors.muted}'
    rounded: '{rounded.pill}'
    height: '{spacing.touch}'
    padding: '0 0 0 12px'
  place-field:
    backgroundColor: '{colors.ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    height: '{spacing.touch}'
    padding: '0 4px 0 12px'
  chip:
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    height: '36px'
    padding: '0 14px'
  chip-pressed:
    backgroundColor: '#7c9bff24'
    textColor: '{colors.cobalt}'
    rounded: '{rounded.pill}'
  answer-panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    padding: '10px 16px'
  answer-time:
    textColor: '{colors.mint}'
    typography: '{typography.display}'
  tag-sample:
    textColor: '{colors.muted}'
    rounded: '{rounded.tag}'
    padding: '1px 6px'
  tag-best:
    backgroundColor: '{colors.mint}'
    textColor: '{colors.on-accent}'
    rounded: '{rounded.tag}'
    typography: '{typography.tag}'
    padding: '1px 5px'
  tag-peak:
    backgroundColor: '{colors.coral}'
    textColor: '{colors.on-accent}'
    rounded: '{rounded.tag}'
    typography: '{typography.tag}'
    padding: '1px 5px'
  results-row:
    height: '{spacing.row-height}'
    textColor: '{colors.ink}'
  results-row-wide:
    height: '{spacing.row-height-wide}'
  road-trip:
    backgroundColor: '{colors.amber}'
    height: '12px'
  road-over:
    backgroundColor: '{colors.coral}'
    textColor: '{colors.on-accent}'
    height: '12px'
  banner:
    textColor: '{colors.ink}'
    height: '48px'
    padding: '4px 16px'
  sheet:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.sheet}'
  sheet-wide:
    width: '440px'
  key-row:
    backgroundColor: '{colors.ground}'
    rounded: '{rounded.field}'
    height: '48px'
---

# Design System: Home Timer

## Overview

**Creative North Star: "The Lit Road Map"**

Home Timer is read at the door, in the car, or at a dim desk before dawn, so it is built night-first: a deep ink-navy ground (#0a0f1e) in which light is the only material. Every departure is a road drawn to scale and lit from within. Amber is the trip at its fastest; coral is the minutes traffic adds on top; mint marks the one slot worth taking. Nothing else glows. The screen divides into regions with 1px hairlines, never with cards or shadows, so the nine road bars read as the content and everything around them stays quiet.

The type carries the same voice. Archivo Variable is used at two widths: expanded (118) for the answer, the brand and every figure a driver compares, and normal (100) for sentences. All numbers sit on tabular lining figures so leave, minutes, arrive and delta stack into columns. Density is deliberate: the first viewport at 390 by 844 holds the controls, the answer and all nine rows without scrolling. Copy is plain and admits uncertainty ("Estimated from typical traffic", a SAMPLE DATA tag until a real key is set).

The system rejects the blue-pin maps-app look, the saturated-yellow retro-map look, and the glow-everything neon dashboard. A daylight theme follows `prefers-color-scheme` and inverts the same tokens rather than introducing new ones.

**Key Characteristics:**

- Night ink-navy ground, one tonal surface, 1px hairline dividers, no shadows, no cards.
- Cased road bars: a 1px darker casing around amber trip and coral overage, with a bounded soft glow.
- Cobalt is reserved ink: focus ring, active segment, primary action, and the small links that act.
- Expanded Archivo for answer and figures, normal width for body, tabular lining figures everywhere.
- Colour never carries meaning alone: BEST and PEAK are words, the SAMPLE DATA state is a word.
- Pill geometry for controls (fully rounded), 10px for the stacked route fields, 4px for tags.

## Colors

A cold, ink-navy field lit by three warm-to-cool signal hues, with one electric accent held back for interaction. The same roles exist in a daylight set; the dark set is canonical in the frontmatter, the `-day` keys are the light-theme values.

### Primary

- **Electric Cobalt** (`colors.cobalt`, #7c9bff): reserved ink. Focus ring (2px, 2px offset), the active segment fill, the primary button fill, the pressed chip outline and text, the swap and locate icons, text-links such as Refresh and Change, the caret, and text selection. Never a data colour, never a decoration.

### Secondary

- **Trip Amber** (`colors.amber`, #ffb547): the trip at its fastest, drawn as the lit fill of every road bar and the first legend swatch. Casing `colors.amber-casing` (#b8761a). Also the warning banner icon.
- **Traffic Coral** (`colors.coral`, #ff6b57): minutes traffic adds (the bar overhang), positive deltas ("+9"), the PEAK tag fill, and the error banner icon. Casing `colors.coral-casing` (#b2392c).
- **Best Mint** (`colors.mint`, #4fe3b0): the best slot only: the departure time in the answer headline, the BEST tag fill, the lit underline under the best bar, and negative deltas ("-6").

### Neutral

- **Night Ground** (`colors.ground`, #0a0f1e): page background, route field fill, settings key row fill, and the foreground on cobalt and accent fills.
- **Panel Ink-Blue** (`colors.surface`, #111933): the answer panel, the place-field popover, and the settings and dialog sheets. The only raised tone in the system.
- **Hairline** (`colors.hairline`, #26325a): every divider and every control outline at rest; also disabled primary fill and the skeleton base.
- **Cold White Ink** (`colors.ink`, #e8edfb): body and figure text.
- **Dusk Muted** (`colors.muted`, #8b97b8): labels, placeholders, secondary figures (arrive, delta dash), footer note, idle segment text, icons at rest.

Derived values live in `src/styles/tokens.css` and are not separate palette entries: glow amber `rgb(255 181 71 / 0.38)`, glow coral `rgb(255 107 87 / 0.34)`, glow mint `rgb(79 227 176 / 0.5)`, best-row tint and cobalt tint `rgb(124 155 255 / 0.1)` and `/ 0.14`, sheet scrim `rgb(5 8 18 / 0.72)`, skeleton highlight `rgb(124 155 255 / 0.32)`. The chip-pressed token above approximates the 0.14 cobalt tint as an 8-digit hex; the CSS value is normative.

### Light theme mapping

Applied under `@media (prefers-color-scheme: light)` by redefining the same custom properties; no component changes. Ground becomes pearl (`ground-day` #f4f6fb), surface a cool pale blue (`surface-day` #ecf0f8), hairline `hairline-day` #c5cde3, ink graphite navy (`ink-day` #131a33), muted `muted-day` #4f5b7a. The signal hues darken for contrast on pale ground: amber to a burnt amber (#b36500, casing #6d3f00), coral to a brick red (#b5301e, casing #6f1c11), mint to a deep green (#066a4b), cobalt to a deeper blue (#3552d9). Text on cobalt and on accent fills flips to white. Glow opacities drop (amber 0.22, coral 0.2, mint 0.3), the cobalt tints become 0.1, and the scrim becomes `rgb(19 26 51 / 0.45)`. `color-scheme` and the two `theme-color` meta tags (#0A0F1E dark, #F4F6FB light) follow the same switch. There is no manual theme toggle.

### Named Rules

**The Reserved Cobalt Rule.** Cobalt appears only on focus, the active segment, the primary action, and small acting links. It is never used to show data, status or decoration. Rows are not selectable, so no row ever turns cobalt.

**The Lit-Only Rule.** Light is the material, and only road bars and the BEST underline emit it. Text, borders, panels and icons never glow.

**The Words-Not-Hues Rule.** The fastest slot and the worst slot are marked by the words BEST and PEAK and by shape (underline, tag), in addition to colour.

## Typography

**Display / Body / Label Font:** Archivo Variable (with Archivo, system-ui, -apple-system, Segoe UI, sans-serif), loaded through `@fontsource-variable/archivo/wdth.css` so the width axis is available. One family, two widths.

**Character:** Expanded Archivo (118) at heavy weights gives the answer and the figures a calm, engineered, signage-like authority; the normal width (100) keeps sentences readable; a slightly condensed width (92) tightens labels and tags. Body copy is set at 15px with a 1.35 line height and tabular lining figures.

### Hierarchy

- **Display** (800, `clamp(30px, 9.4vw, 40px)`, line-height 1.02, letter-spacing -0.02em, wdth 118): the answer headline ("Leave 14:08"), with the time in mint. Becomes `clamp(40px, 3.6vw, 52px)` at 900px and up (Display Wide), line-height 1.
- **Title** (700, 22px, -0.01em, wdth 118): sheet and dialog titles. The brand wordmark in the band is the same treatment at 20px.
- **Figure** (leave time 700 at 16px; minutes 800 at 15px; both wdth 118, tabular lining): the compared numbers in each row.
- **Body** (400, 15px, line-height 1.35, wdth 100): inputs, the one-line comparison under the answer, bold figures inside it at 700.
- **Body small** (13px for arrive, delta and hints; 14px for banners, chip text and buttons): secondary text.
- **Label** (500, 12px, wdth 92, line-height 1.2): route field labels (From, To), column heads, legend. Settings group labels are 13px at the same weight and width.
- **Tag** (800, 10px, letter-spacing 0.06em, wdth 92, uppercase by copy): BEST and PEAK. The SAMPLE DATA tag is 700 at 11px with 0.04em tracking.

### Named Rules

**The Expanded Figures Rule.** Anything the driver compares or acts on (answer, leave, minutes, brand) is set at wdth 118; sentences stay at 100.

**The Tabular Column Rule.** Tabular lining numerals are set on `body` and re-asserted on the table, so figures in each column align regardless of digit.

**The Real Weights Rule.** Label weights are 500 in the build (not thin). Do not drop labels to light weights on the dark ground; they lose legibility.

## Layout

**Spacing scale:** 4, 8, 12, 16, 24, 32 px (`space-1` to `space-6`). Hard-coded one-offs also appear in the build (6px, 10px, 14px, 36px, 48px) and are not tokens.

**Mobile (below 900px):** a single column, full width up to a max-width of 480px, centred. Order top to bottom: brand band, optional banner, route fields with swap and chips, when section, answer panel, legend and result rows, footer. Horizontal page padding is 16px. Touch targets are 44px (`touch`). Result rows are 38px tall with 1px hairline tops. Safe-area insets are respected on the shell and the footer and sheet padding.

**Wide (900px and up):** the frame becomes up to 1100px wide with hairline borders on both inline edges, and `main` is a two-column grid: controls and answer on the left at 460px (sticky at the top), results on the right up to 640px, separated by a hairline. Rows grow to 44px, side padding rises to 24px, the answer panel pads 24px, the headline switches to Display Wide. The sheet becomes a centred 440px dialog with a 16px radius instead of a bottom sheet.

**Small phones (440px and below):** the segmented control tightens (10px padding, 13px text), the time pill drops its clock icon, and the Change text link collapses to a 44px pencil icon button.

**Results grid:** five columns share a single table grid so figures align: Leave (expanded, left), Duration (the bar, takes remaining width, minimum 80px), Min (right), Arrive (right, muted), delta versus the first slot (right, coral for plus, mint for minus, muted dash for the first row). All bars share one track scale so lengths compare across rows.

**Rhythm:** regions are separated by 1px hairlines rather than gaps. Vertical padding is tight and uniform within a region; the density target is that controls, answer and all nine rows fit the 390 by 844 first viewport.

Breakpoints are not tokenised: 900px and 440px appear as literals in the component CSS.

## Elevation & Depth

Flat. There are no shadows on panels, cards, buttons, fields, popovers or sheets. Depth is conveyed by one tonal step (ground to surface) and by hairlines. The only `box-shadow` in the build is the bounded glow on road bars and the BEST underline, and it is light, not elevation.

### Shadow Vocabulary

- **Trip glow** (`box-shadow: 0 0 8px var(--glow-amber)`): the amber trip segment of a bar.
- **Overage glow** (`box-shadow: 0 0 8px var(--glow-coral)`): the coral overhang segment.
- **Best edge** (`box-shadow: 0 0 8px var(--glow-mint)`): the 3px mint underline 6px below the best bar.

### Named Rules

**The Flat Panels Rule.** Panels, sheets, popovers and fields never carry a shadow. A sheet is separated from the page by the scrim and a 1px hairline.

**The Bounded Glow Rule.** Glow is an 8px, low-opacity bleed that stays inside the row. It is never larger, never animated, never applied to text, borders or panels.

## Shapes

Control geometry is fully rounded: buttons, the segmented control, the time pill, chips, the swap and locate buttons, and round icon buttons all use 999px. The stacked From/To fields are one 10px-radius block (the top field rounds its top corners, the bottom field its bottom corners, joined by a shared hairline). Tags (SAMPLE DATA, BEST, PEAK) are 4px. Sheets are 16px (top corners only on mobile). Road bars are square-cornered, cased strokes: a 1px darker casing on a flat fill, the trip and overhang butted together with the casing doubled up removed at the join. Borders are 1px hairline at rest and 1px cobalt on hover, active or focus-within. Empty-slot chips use a dashed hairline border. The brand mark is a 28 by 14 miniature of a bar: an amber trip block with a coral end, cased the same way.

## Components

### Brand band

Slim 48px band with a bottom hairline: the road mark and "Home Timer" in Title/Brand (20px, 700, wdth 118) on the left, a 44px round settings icon button on the right in muted, ink on hover. Left padding 16px, right padding 8px.

### Route fields, swap and chips

- **Fields:** two stacked 44px fields (From above, To below) forming one 10px-radius block on ground fill, 1px hairline border, 12px left padding. A 34px muted label (12px, 500, wdth 92) precedes a 15px input. Focus-within turns the border cobalt and raises z-index; the input's own outline is suppressed in favour of that border.
- **Locate:** a 44px round cobalt icon button inside the From field (muted when disabled, with a spin animation while locating).
- **Swap:** a 44px round button in a second grid column, 1px hairline border, cobalt icon, cobalt border on hover.
- **Chips:** Set Home / Set Work / saved places as 36px-tall pills inside a 44px touch target, 14px side padding, 14px 600 text. Pressed state is cobalt border, 0.14 cobalt tint, cobalt text. An unset place renders dashed and muted with a plus icon.

### Segmented control and time pill

- **Segmented:** a 44px pill container with a 1px hairline border holding Now and Leave at. Idle segments are muted 14px 600 text; the checked segment fills cobalt with `on-cobalt` text. A visually hidden radio sits over each option; focus-visible draws the 2px cobalt ring with 2px offset.
- **Time pill:** a flex-filling 44px pill (basis 160px) showing the chosen day and time in 14px 700. Muted with a hairline border when "Now"; ink with a cobalt border when active. A fully transparent native date-time input covers the pill so it keeps the label, keyboard editing and platform picker. A "Change" text link (12px, 600, cobalt) sits at the right and becomes a pencil icon at 440px and below.

### Answer panel

The only filled region: surface fill, bottom hairline, 10px 16px padding (24px on wide). Holds the headline "Leave" in Display with the departure time in mint, an optional SAMPLE DATA tag at the right (1px muted border, 4px radius, muted 11px 700 text), and one or two 15px comparison lines in ink with 700 figures ("27 min, arrive 14:35 - 6 min faster than 12:08"). While loading it shows skeleton bones (headline 62% by 34px, lines 88% and 54% by 14px) with a hairline-to-cobalt shimmer.

### Results table and RoadBar

- **Legend:** two 14 by 8px cased swatches (amber: "Trip at its fastest"; coral: "Extra minutes from traffic"), 12px muted.
- **Rows:** 38px, hairline top, no row selection, no hover treatment. Leave in expanded 16px 700, minutes in expanded 15px 800, arrive and delta in 13px muted (delta coral or mint at 600).
- **RoadBar:** a 12px-high track. Width is trip plus overage as a share of one shared scale. Trip segment: amber fill, 1px amber casing, 8px amber glow. Overage segment: coral fill, 1px coral casing (left casing removed so the join is single), 8px coral glow. A bar draws in from the left (scaleX 0 to 1) over 600ms with `cubic-bezier(0.16, 1, 0.3, 1)` and 35ms stagger per row.
- **PEAK:** the worst slot's word sits inside the coral overhang (10px 800, 0.06em, `on-accent`) when wide enough, else a coral tag beside the bar.
- **BEST:** a full-row cobalt tint (0.1), a mint BEST tag (10px 800, 0.06em, `on-accent` text) beside the bar, and a 3px mint underline 6px below the bar, full bar width, with a mint glow, drawn in with the bar. No coloured side stripe.
- **States:** loading rows show a 60% by 12px shimmer skeleton in the bar cell; error rows show a muted 12px hint; spent (past) rows strike the leave time through in muted 500 and dim the bar to 0.45.

### Banners

48px minimum height, 16px side padding, 12px gap, bottom hairline, 14px text with a leading icon and an optional action (for example a primary "Add key" button). Tone is carried by the icon colour only: info cobalt, warning amber, error coral. There is no tinted background and no side stripe.

### Settings sheet and place dialog

A native `dialog` sheet: surface fill, 1px top hairline, 16px top radius, scrim `rgb(5 8 18 / 0.72)` behind it, anchored to the bottom on mobile (max height `min(92dvh, 720px)`) and a centred 440px dialog with a full hairline border at 900px and up. Title in Title (22px, 700, wdth 118) with a 44px round close button. Groups stack with 24px gaps; labels are 13px 500 wdth 92 muted. The API key row is a 48px, 10px-radius field on ground fill with a 16px input and a reveal icon button; focus-within turns the border cobalt. Language is a two-option pill radio group using the segment-active pattern. A hairline-topped privacy note in 13px muted precedes right-aligned actions (quiet and primary buttons).

### Buttons

- **Primary:** cobalt pill, `on-cobalt` text, 44px minimum height, 16px side padding, 14px 600. Hover `filter: brightness(1.08)`. Disabled is hairline fill with muted text.
- **Quiet:** transparent pill, 1px hairline border, ink text; hover turns border and text cobalt.
- Text-link actions (Refresh, Change, Save as) are cobalt 600-700 text; Save as is underlined.

### Place combobox

The From and To inputs are an ARIA combobox. The popover sits 4px below the field, surface fill, 1px hairline border, 10px radius, no shadow, 280px max height, scrolling. Options are at least 44px tall with 8px 12px padding, hairline tops (none on the first), a 600-weight label and a 13px muted address. The active option (keyboard or hover) takes the 0.14 cobalt tint. A message row (14px muted) shows empty and no-result states. The matched prefix in the field display is bolded (700).

### Footer

Top hairline, 16px side padding (24px wide), bottom padding equal to the safe-area inset. Left: "Estimated from typical traffic" in 12px muted. Right: a Refresh action, cobalt 13px 700 with a 44px target and a 6px-gap refresh icon; underlined on hover.

### Motion

There are no state transitions in the build: hover, focus and checked states change instantly. Motion exists in exactly three places: the bar draw-in (600ms, `cubic-bezier(0.16, 1, 0.3, 1)`, 35ms stagger), the skeleton shimmer (1.4s linear, infinite) and the locate spinner (900ms linear, infinite). Under `prefers-reduced-motion: reduce` the draw-in, shimmer and spinner are all disabled and bars appear instantly.

## Do's and Don'ts

### Do:

- **Do** divide regions with 1px `hairline` borders and let the single `surface` step (the answer panel and sheets) be the only raised tone.
- **Do** build every bar as a cased stroke: 1px darker casing, flat lit fill, 8px glow, amber for the trip and coral for the overage on one shared scale.
- **Do** keep cobalt for focus (2px ring, 2px offset), the active segment, the primary action and small acting links, and nothing else.
- **Do** set compared numbers in expanded Archivo (wdth 118) on tabular lining figures, and body sentences at wdth 100.
- **Do** mark BEST and PEAK with words and shape as well as colour, and mark demo data with a visible SAMPLE DATA tag.
- **Do** keep 44px minimum touch targets and 16px mobile side padding; honour safe-area insets.
- **Do** swap tokens for light mode (same names, new values) rather than adding light-only components.
- **Do** disable every animation under `prefers-reduced-motion: reduce` and render bars at full length.

### Don't:

- **Don't** add drop shadows, cards, raised buttons or elevation of any kind; the only box-shadow is the bounded 8px glow on road bars and the BEST underline.
- **Don't** let glow touch text, borders, panels, icons or any element that is not a road bar or the BEST underline.
- **Don't** use coloured side stripes or left/right accent borders on rows, banners or panels; the best row is a full-row tint plus the underline.
- **Don't** add eyebrow labels, kickers or small-caps overlines above headings or sections.
- **Don't** use cobalt for data, status, decoration or row selection, and don't make rows selectable.
- **Don't** use proportional or oldstyle figures in any numeric column.
- **Don't** convey fastest, slowest or sample status by hue alone.
- **Don't** hard-code new colours, radii or font sizes in components when a token exists; add one-off pixel values to the tokens first.

**Known build drift, not canonized:** several literal pixel values (6, 10, 14, 36, 48px), the 900px and 440px breakpoints, the 16px sheet radius, and the shimmer and spinner durations are hard-coded in component CSS with no token. The chip tint is approximated in the frontmatter as an 8-digit hex. Labels use weight 500, not the thinner weights the direction contract suggested.
