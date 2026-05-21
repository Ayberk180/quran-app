---
name: Masjid Quran Learning
description: A quiet mountain scriptorium for children learning sacred verses — tap to hear, carry in the heart.
colors:
  mountainside-pine: "#0f5132"
  unspun-fleece: "#f5efe3"
  granite-night: "#1a1a1a"
  river-stone: "#6b7280"
  snow-ridge: "#ffffff"
typography:
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  arabic-phrase:
    fontFamily: "'Amiri Quran', 'Scheherazade New', serif"
    fontSize: "1.5em"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  surface: "12px"
spacing:
  base: "1rem"
  tight: "0.5rem"
  micro: "0.25rem"
components:
  lesson-card:
    backgroundColor: "{colors.snow-ridge}"
    textColor: "{colors.granite-night}"
    rounded: "{rounded.surface}"
    padding: "1rem"
  lesson-card-hover:
    backgroundColor: "{colors.snow-ridge}"
    textColor: "{colors.granite-night}"
  phrase-tile:
    backgroundColor: "{colors.unspun-fleece}"
    textColor: "{colors.granite-night}"
    rounded: "{rounded.surface}"
    padding: "0"
  phrase-tile-hover:
    backgroundColor: "{colors.unspun-fleece}"
    textColor: "{colors.granite-night}"
---

# Design System: Masjid Quran Learning

## 1. Overview

**Creative North Star: "The Mountain Scriptorium"**

In the highland villages of Dagestan, scholars kept Arabic manuscript traditions alive through centuries of isolation and turbulence. Karachay felt-makers encoded meaning in geometric kiyiz patterns worn down to the wool's weave. Circassian craftspeople worked silver with a precision that required decades of apprenticeship. This design system draws from that inheritance: the idea that learning happens in a specific, unhurried place — and that the place itself is part of the teaching.

The app is not a classroom product. It is a room. Granite-dark text on a surface that recalls unspun mountain wool. A single deep pine green that marks where to look and where to tap. The phrase tiles laid out as a felt-maker would place a geometric repeat — regular, honest, structural. When a child taps one, they hear the voice of a teacher they may never meet. The interface should feel like that encounter deserves respect.

This system explicitly rejects: Duolingo-style gamification (no streaks, badges, mascots, confetti); the generic "Islamic app" shorthand (dark green + gold borders, arabesques as wallpaper); Western edtech dashboard aesthetics (white + teal, data charts, completion percentages in rings); anything that treats this content as a product to be marketed or a game to be won.

**Key Characteristics:**
- Light theme; mountain noon light, not screen glow
- Mountainside Pine on ≤10% of any screen — its rarity is its authority
- Unspun Fleece for all phrase content surfaces
- The phrase tile grid as the primary visual pattern; geometry from structure, not ornament
- Arabic and Turkish content treated with full typographic weight alongside English
- Flat by default; depth through border-shift and restrained press animation

---

## 2. Colors: The Highland Palette

Caucasus mountain tones: deep forest, undyed wool, water-smoothed stone. Three roles, no room for spectacle.

### Primary
- **Mountainside Pine** (`#0f5132`, `oklch(34% 0.088 152)`): The north-facing slope color of highland pines in the Chechen and Karachay highlands. Used exclusively on hover/focus border states, back-link text, and interactive affordances. Never used as a background fill or decorative element. Its scarcity gives it authority — when it appears, it means "here."

### Neutral
- **Granite Night** (`#1a1a1a`, `oklch(15% 0.003 152)`): All body text and headings. Not pure black; a barely-perceptible tint toward pine green holds it in the system. When refactoring to OKLCH, use `oklch(15% 0.007 152)` rather than `oklch(15% 0 0)`.
- **River Stone** (`#6b7280`, `oklch(51% 0.013 254)`): Muted secondary text — lesson numbers, descriptions, empty states. Default card and tile borders at rest. Named for the smooth, gray-green river stones of Caucasian mountain streams.
- **Snow Ridge** (`#ffffff`): Current app surface background. When migrating to OKLCH, replace with `oklch(99% 0.005 152)` — a trace tint toward pine. Pure white reads as clinical; the tint is invisible at a glance but warmer in use.
- **Unspun Fleece** (`#f5efe3`, `oklch(95% 0.018 83)`): Phrase tile backgrounds only. References the warm cream of Karachay and Circassian mountain wool before dyeing — the same material that becomes felt, felt that becomes geometric pattern, pattern that becomes meaning. This is where the learning content lives.

**The Mountainside Pine Rule.** Mountainside Pine is used on ≤10% of any given screen. It appears only to mark interaction — hover borders, focus rings, active links. Using it as a background fill or section color breaks its function. When it appears, the eye follows; that only works if it appears rarely.

**The Felt-Maker's Two-Tone Rule.** The two non-neutral colors of the palette — Mountainside Pine and Unspun Fleece — never appear on the same surface simultaneously as background fills. Pine is for borders; Fleece is for tile backgrounds. Keeping them separate preserves the quiet contrast that defines the visual field.

---

## 3. Typography

**UI Font:** system-ui, -apple-system, sans-serif (system default stack)
**Arabic Font:** Amiri Quran (primary), Scheherazade New (fallback) — both scholarly serif typefaces optimized for Quranic text

**Character:** Two voices, absolutely separated. The UI font is structural — it scaffolds the interface without drawing attention. Amiri Quran is the content voice: a typeface with centuries of manuscript tradition behind it, designed for printed Qurans, carrying the same gravity as the text itself. When they appear together, the Arabic leads and the UI defers.

### Hierarchy
- **Title** (system-ui, 600 weight, 1rem, 1.4 line-height): English lesson titles on cards and lesson-view headers.
- **Arabic Subtitle** (Amiri Quran, 400 weight, 1.25rem on cards / 1.5em in lesson view, 1.6 line-height): Arabic lesson titles. On lesson cards, pushed to the bottom via `margin-top: auto`, anchoring the card visually. In the lesson view header, follows the English title.
- **Body** (system-ui, 400 weight, 1rem, 1.5 line-height): Lesson descriptions. Cap at 65ch line length.
- **Label** (system-ui, 400 weight, 0.875rem, 1.4 line-height): Lesson numbers, metadata, empty states, muted secondary content.

**The Two-Voice Rule.** The system has exactly two typefaces. System-ui handles all Latin UI scaffolding. Amiri Quran handles all Arabic content. No third typeface is ever introduced. The Arabic font is never applied to Latin labels; the system font is never applied to Arabic content. This rule is absolute.

**The Turkish Parity Rule.** Turkish UI labels and Arabic lesson content share equal visual hierarchy. Turkish text in navigation or headings is set at the same weight and size as equivalent English text — never smaller, never lighter. Turkish is not a footnote.

---

## 4. Elevation

This system is flat by default. Depth is conveyed through the single technique the Caucasus craftsperson understands best: edge clarity. Cards and tiles sit flush on the surface. At rest, they announce themselves with a 1px River Stone border — visible but not heavy, like the edge of a stone tile in a mosque floor. On hover or focus, that border becomes Mountainside Pine. On active press, the surface scales inward (`scale(0.96–0.98)`) as though yielding to a fingertip.

No `box-shadow` exists anywhere in this system. Depth is not atmospheric; it is positional.

**The No-Shadow Rule.** `box-shadow` is prohibited on cards, tiles, navigation elements, and static surfaces. Shadows are permitted only when a surface physically lifts above another in response to direct user action — a bottom sheet, a modal overlay. Ambient shadows, decorative glows, and "card elevation" patterns are forbidden.

---

## 5. Components

### Phrase Tile (Signature Component)

The central artifact of the app. A child taps this dozens of times per session. It is both a button and a page fragment — a manuscript tile.

- **Shape:** 12px radius (gently curved). Aspect ratio 1:1. Square, the proportion of a tile.
- **Background:** Unspun Fleece (`#f5efe3`). Warm, unhurried. The phrase image sits on it as text sits on aged paper.
- **Border:** 1px River Stone at rest. 1px Mountainside Pine on hover/focus. No outline separate from border — the border IS the focus indicator.
- **Active state:** `transform: scale(0.96)` at 80ms ease-out. Grounded; not bouncy.
- **Grid layout:** 4 columns, 0.5rem gap. The repetition of square tiles in a grid is the geometric pattern — earned by structure, not added as decoration.

### Lesson Card

- **Shape:** 12px radius. Flex column, minimum 120px height.
- **Background:** Snow Ridge (app surface).
- **Border:** 1px River Stone → 1px Mountainside Pine on hover/focus. Identical logic to phrase tile for system consistency.
- **Padding:** 1rem internal.
- **Typography stack:** Label (lesson number, muted) at top; Title (lesson name, bold) in middle; Arabic subtitle (Amiri Quran, 1.25rem) pushed to bottom via `margin-top: auto`. The Arabic anchors the base — it reads last in English reading order, first in the eye's gravitational pull.
- **Active state:** `transform: scale(0.98)` at 120ms ease-out.

### Back Link / Navigation

- **Style:** Mountainside Pine text link, no underline at rest.
- **Hover/Focus:** Underline appears.
- **Form:** Inline text, not a contained button. Tapping "back" should feel like retracing a path through a building, not pressing a control.

### Inputs / Fields

No form inputs exist in the current build. When introduced: 1px River Stone border, 8px radius (slightly tighter than surface components), Mountainside Pine focus border, no glow. The same border-shift pattern carries through — the system has one interaction vocabulary.

---

## 6. Do's and Don'ts

### Do:
- **Do** use Mountainside Pine only for interactive affordances — hover borders, focus states, active text links. Nothing else. Its restraint is the design.
- **Do** give every phrase tile Unspun Fleece as its background and maintain the 1:1 aspect ratio. The warmth and proportion are what make it feel like a learning artifact.
- **Do** use border-shift (1px River Stone → 1px Mountainside Pine) as the universal hover/focus treatment across all interactive surfaces. One vocabulary, everywhere.
- **Do** use `transform: scale()` at 80–120ms ease-out for active/press states. No layout properties animated, no bounce, no elastic curves.
- **Do** tint all neutrals toward Mountainside Pine (hue 152) when migrating to OKLCH. Pure `#000` and pure `#fff` are banned from the system.
- **Do** place Arabic text (Amiri Quran) at sizes that honor the content: never below 1.2rem in any context, never truncated with ellipsis.
- **Do** give Turkish UI labels the same typographic weight as equivalent English labels. They are co-primary languages.

### Don't:
- **Don't** add streaks, XP bars, achievement badges, mascots, or confetti. Quranic learning is not a game and this app will never be Duolingo.
- **Don't** use dark green + gold ornamental borders, arabesques as wallpaper, or decorative calligraphy splashed across backgrounds. The generic Islamic app aesthetic trivializes what it attempts to honor.
- **Don't** build completion dashboards with ring charts, percentage metrics, or data-heavy progress summaries. Progress appears as a simple count or marker — never displayed as an achievement to be optimized.
- **Don't** add `box-shadow` to cards, tiles, or navigation. No ambient shadows. No "lifted card" treatment.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on any card, list item, or callout. Rewrite with a full border, background tint, or nothing.
- **Don't** use gradient text (`background-clip: text` with a gradient fill). Single solid colors only.
- **Don't** use system-ui for Arabic content or Amiri Quran for Latin UI labels. The Two-Voice Rule is absolute.
- **Don't** introduce a third typeface without explicit discussion. The type pairing is closed.
