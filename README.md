# Páramo — concept site

A concept website for Páramo, a fictional applied-AI lab in Bogotá that forecasts Andean water. It follows the structure, proportions, type scale and motion of the reference studied in `study/STUDY.md`, with a fully new identity: name, logo, colours, type, copy, images and code.

Static HTML, CSS and JavaScript. No build step. All paths are relative, except `404.html`, which uses site-root paths (`/css/…`) because GitHub Pages serves it at any missing URL. Publish the `app/` folder at the root of a GitHub Pages subdomain.

## Pages

| Path | What it holds |
|---|---|
| `index.html` | Hero postcard that follows Bogotá's sun (only the current phase's image is downloaded), stripes, vision with the pixel frailejón, the 5-step sticky stepper, the Páramo Forecast card, Notes from the mountain, and the revealed footer |
| `about/index.html` | Hero in the current light phase with a sticky glass card, the story letter with signatures and a pixel stamp, values on an image, team, partners, closing |
| `writing/index.html` | Featured essay and an index of six pieces (five are marked "Coming soon" and are not links) |
| `writing/the-water-under-the-fog/index.html` | The full essay (750 px column, 18/31.5) with copy link and closing CTA |
| `contact/index.html` | Request access form with inline validation, loading, success and error states (simulated locally, nothing is sent) |
| `404.html` | Page not found |

Files: `css/site.css` (every page), `js/site.js` (every page), `js/home.js` (home only), `assets/`, `favicon.svg`.

## Fonts

- Headings: **Redaction 35** (OFL-1.1), `@fontsource/redaction-35@5.3.0` from jsDelivr, weight 400 only, with kerning and ligatures off so the pixel grid holds. It loaded fine, so the Pixelify Sans / Instrument Serif fallback was not needed.
- Text and UI: **Onest** 400/500/600/700, `@fontsource/onest@5.3.1` from jsDelivr.

## Libraries

- None. The sticky stepper is a plain scroll listener in `home.js` (step = floor(progress × 5)); GSAP was removed. Sun position, clock, menu, reveals, pixel art and the form are plain JavaScript. Fonts are the only third-party requests.
- **Stepper on short or zoomed screens:** at 1024 px wide and up with 820 px of height or less, the heading scrolls away and the stage sits 72 px under the nav. `home.js` measures the room left under the sticky top and shrinks the figure to fit; if even a small figure cannot fit (about 400 % zoom, or a 320 × 568 phone), the section becomes a plain list of the five steps, each with its own figure.

## What follows the reference

- Layout: 1080 / 1280 containers, side padding 20/32/48/120, vertical rhythm 120/160/200/220, breakpoints 640/768/1024/1280/1536, and the nav that switches from a centred glass pill to a full-width bar with a menu button below 1024 px.
- Home order and sizes: hero (aspect 1553/1450, minimum 800 px tall on small screens) → 38 px stripes → two-column vision (2 × 508, gap 64) → 5000 px stepper (3500 px below 1024) with sticky heading (top 100, height 270) and sticky stage (top 370), the double-bezel figure and "Fig. N" captions → product card rising over the stepper → three 400 × 350 cards (1 / 2 / 3 per row) → footer with a 500 px revealed layer (400 px below 1280).
- Type scale: 54 / 48 / 40 / 27 display, 18 / 17 / 15 / 13 text, 500 as the default weight.
- Surfaces: glass on images only (blur 15, 1 px white 20 % border, short shadow), double bezel on light sections, the 5 px ring on hover, and the pill arrow chip with its 0.8 s conveyor loop.
- Motion: word-by-word reveal on two lines only (home H1 and the vision line), a cell-by-cell dissolve, stepper text swaps (0.3 s out / 0.4 s in with a 2 px blur), typewriter at 30 ms per character on a 4 s cycle with toasts, nav theme by section, the corner-wipe mobile menu, and the image crossfade when the light phase changes.

## What is original

- **Brand:** Páramo, the 7 × 9 pixel frailejón logo over a horizon line, the moss palette (`#eef0e6`, `#e2e6d6`, `#14201a`, `#4b5a4f`), frailejón gold `#d9a637` and water blue `#2f6f8f`.
- **The signature, changed:** the hero follows the real sun over **Bogotá** (4.711° N, 74.072° W) instead of New York. It works out the sun's altitude in the browser: night below −6°, dawn or golden hour between −6° and 6° (morning or evening), and day above that. It checks again every minute, on focus and when the tab comes back. The live clock reads `BOGOTÁ 06:42` in `America/Bogota`. The footer artwork and its caption change with the phase, and a screen reader hears "It is now … in Bogotá." when the phase changes. Add `?phase=dawn|day|golden|night` to any URL to preview a phase.
- **The pixel flower became a frailejón:** an SVG of about 700 eight-pixel cells that builds itself cell by cell.
- **The stepper diagram:** our own SVG, which moves from sensor points to watersheds, streams into a reservoir, a 7/30/90-day range fan, and finally a threshold alert on a phone.
- All copy comes from `COPY.md`. People, partners, cases and figures are fictional and labelled as such.

## Assets

Used from the project's `assets/`: `hero-dawn/day/golden/night` (resized to 1280 and 1920 widths as well as the 2560 original) and `writing/w-01..03` (plus 800-wide copies). `og.jpg` (1200 × 630) is a crop of `hero-dawn`, referenced with its absolute URL on `paramo.wolfbc.art`, plus `og:url` and a canonical link on every page. `apple-touch-icon.png` (180 × 180) is the favicon glyph.

Replaced with CSS, SVG or canvas instead of extra images:
- **Footer pixel art:** drawn into a `<canvas>` from the hero file already on screen (inner pages fetch the 1280 file once, when the footer is near). A closer crop than the hero (frailejones, shore, walker) is shrunk to 6 px cells and snapped with a 4 × 4 Bayer ordered dither to a small palette of moss, frailejón gold and water blue. Each sun phase has its own palette, and the art is redrawn when the phase changes.
- **Product card art:** the same dither on a single water-blue ramp with the frailejón flowers kept in gold (a darker ramp below 1024 px, where the text runs over it).
- **About values background:** the same dither on a close crop of the frailejón rosettes, in the phase palette.
- **Pixel frailejón, logo, arrow chevron, chat bubble, stamp, signatures, toast icons:** inline SVG.
- **Three writing cards without a painting** ("Seven days…", "What a wide range…", "Why we forecast streams…"): pixel compositions in ink, gold and water, as inline SVG.
- **Stripes:** CSS gradients with hard stops.

## Accessibility

One `h1` per page with headings in order, a skip link, visible focus rings (white on the dark nav and the blue card), `aria-expanded` and a state-specific label on the menu button, and a mobile menu that makes the page behind it `inert`. Text over the painting has a top veil, a corner veil and a darker glass: every hero text was measured pixel by pixel at the 5th percentile in all four sun phases at 320–1440 px and passes AA (`review/FIXES.md`). Phone tap targets are 44 px. No sideways scroll at 320 px. The five stepper steps are also listed in a screen-reader-only list, and the visual stepper is hidden from assistive tech. The typewriter and toasts have a "Pause examples" button. The "sensor" term works on hover, focus and tap. Under `prefers-reduced-motion` nothing animates: words and pixels show at once, the typewriter holds on the first service (the pause button is hidden), stepper steps swap instantly, and the menu opens without the wipe.

## Not included

The reference also has Careers and Privacy pages. The brief lists only the pages above and `COPY.md` has no text for them, so they are not in this concept.
