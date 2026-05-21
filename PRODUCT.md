# Product

## Register

product

## Users

**Primary:** Children ages 4–12 at a local masjid, using shared phones or tablets — often without a teacher present, sometimes without reliable WiFi. They tap images to hear pronunciation and repeat. UI must work for a 5-year-old who cannot read labels.

**Secondary:** Parents supervising at home; masjid teachers handing devices to students or projecting in class. Any adult in the community may open this app with zero training — navigation must be self-evident.

**Community language:** Turkish + English bilingual UI (navigation, labels, lesson titles).

## Product Purpose

A PWA for learning Quranic phrase pronunciation. Each phrase from the teaching book appears as an image; tapping it plays the correct audio recording. No accounts, no backend, no internet required after the first load.

This is a sadaqah jariyah project. Simplicity, reliability, and longevity matter more than any feature. The app must still work in ten years with minimal maintenance by a volunteer who is not a developer.

## Brand Personality

Serene. Grounded. Timeless.

The emotional register is calm focus — the feeling of sitting in a highland masjid and learning something sacred, not playing a game. Caucasus craft traditions are the aesthetic reference: Karachay felt geometry, Dagestani manuscript precision, Circassian metalwork intentionality. Nothing should feel decorated for its own sake.

## Anti-references

- **Duolingo and gamified edtech:** no streaks, XP bars, achievement badges, mascots, confetti, or reward loops. Quranic learning is not a game.
- **Generic "Islamic app" aesthetic:** dark green + gold ornamental borders, arabesques as wallpaper, decorative calligraphy splashed everywhere. These patterns have become a cliché; they trivialize what they're meant to honor.
- **Western edtech dashboards (Khan Academy, Coursera):** clean white + teal, data-heavy progress views, clinical sans-serif everything.
- **Flashcard/test-mode UIs:** Anki-style flip cards, pass/fail indicators, quiz scoring.

## Design Principles

1. **The content is the teacher.** The phrase image and audio are what teach. Every design decision should frame and serve them — not compete, not decorate, not distract.
2. **Caucasus precision, not Caucasus ornament.** Draw from Karachay felt geometry, Dagestani manuscript proportion, and the considered mountain palette. Patterns earn their place through structure, not nostalgia.
3. **Touch-first, age-five proof.** Tap targets sized for small fingers. Visual feedback that's immediate and obvious. No hover-only affordances. No small text for critical actions.
4. **Calm accomplishment, not reward loops.** Progress is visible — completed phrases, finished lessons — but it doesn't celebrate or guilt. A child should feel they've done something real, not earned a sticker.
5. **One job per screen.** The lesson list does one thing. The lesson view does one thing. No settings panels crowding the primary surface.

## Accessibility & Inclusion

Good defaults: WCAG-level contrast on all text and interactive elements, large tap targets (minimum 44×44px), `aria-label` on every audio button (using transliteration). Respect `prefers-reduced-motion` for any animations. No color-only status indicators.
