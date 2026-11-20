# Art direction (plan, not implemented)

The current UI is deliberately unstyled HTML so we can tune the game loop. This is the
plan for the separate graphics pass. Nothing here exists in code yet.

## Scene

- **Office view (top half):** the IT demand manager's office seen from the side: desk,
  door, a window onto the corridor where requesters queue. The person at the front of
  the queue steps up to the desk.
- **Desk view (bottom half):** close-up of the desk surface. The demand form lands here
  as a sheet of paper. The application catalog is a binder with one tab per capability
  (Sales & Marketing, Finance, …), one page per capability.
- **Actions** become physical: an APPROVED stamp (buy), a DECLINED stamp, and
  sliding a catalog page back across the desk (offer an existing app).

## Pixel style

- Fixed low-res logical canvas, e.g. **480×270** (16:9). Integer-scale to fit the
  window (`transform: scale(n)`, letterbox the remainder) and set
  `image-rendering: pixelated` on everything.
- Small fixed palette (~24–32 colours), muted office tones (beige, grey, faded blue)
  plus a few loud accents for stamps and happy/unhappy feedback. Keep the palette in one
  file and only use those colours.
- Bitmap pixel font for paper text (one ~5–7 px tall font for forms, one larger one
  for headings). Keep text as real DOM text so it stays readable and copyable.
- Keep the current split: `src/game/` stays rendering-free, and the graphics pass
  only replaces `src/App.tsx` and adds `src/ui/`.

## Generated people (requesters)

Characters are built from layered sprites, all the same size (e.g. 32×48), stacked
in a fixed order:

1. body / clothing (office shirt, hoodie, suit, lab coat, hi-vis vest, …)
2. skin tone (palette swap of the base body, not separate art)
3. head shape
4. hair style × hair colour (palette swap)
5. eyes, eyebrows, mouth (the mouth layer also shows the mood: happy / neutral / annoyed)
6. accessories (glasses, headset, lanyard, hard hat)

- Pick each layer with a **seeded RNG** keyed by the demand id, so the same requester
  always looks the same.
- Clothing can hint at the department (hi-vis for manufacturing, suit for sales)
  without a new data field. Derive it from the matched or likely capability.
- Mood comes from the outcome. The requester walks away happy or annoyed after
  your decision.
- Rough variety: 6 bodies × 4 skins × 3 heads × 8 hair × 5 hair colours × 4 faces ×
  5 accessories ≈ 58k combinations from about 35 drawn sprites.

## App icons

Each catalog app gets a 16×16 (or 24×24) icon. Plan: generate rather than draw them all.

- **Base shape** from the capability (rounded square = Sales & Marketing,
  shield = Finance, …) and **base colour** from the capability palette slot.
- **Glyph** chosen from a small hand-drawn set of 8×8 glyphs by the app's first tag
  (envelope = email, box = inventory, magnifier = inspections, calendar = absences, …).
  Fall back to the app's initial letter in the pixel font.
- **Variation** (border style, accent stripe) from a hash of the app id, so two apps
  with the same glyph still look different.
- Requested (not yet owned) apps on the demand form use the same generator in a
  "boxed / price-tag" frame, which hints that they cost money.

## Assets and tooling

- Draw in Aseprite (or LibreSprite). Export sprite sheets plus a JSON atlas into
  `src/assets/`.
- A small build step (or just runtime canvas compositing) layers the character and
  icon parts. Composite once per requester or app and cache the result as a data URL.
- Audio later: stamp thunk, paper shuffle, door, a happy/annoyed murmur.
