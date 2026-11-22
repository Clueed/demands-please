# Demands, Please: development

Everything technical about the game. The player-facing page is [README.md](README.md).

## Stack

- **Vite 8** + **React 19** (React Compiler via `@rolldown/plugin-babel`) + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **shadcn/ui** (Base UI primitives, `nova` style, lucide icons)
- **Oxlint** (type-aware via `oxlint-tsgolint`) + **Oxfmt**
- **Vitest**
- **pnpm**
- **Cloudflare Workers** (static assets, SPA fallback) via `@cloudflare/vite-plugin` + Wrangler

## Scripts

| Command           | What it does                             |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Start the dev server                     |
| `pnpm build`      | Typecheck and build to `dist/`           |
| `pnpm preview`    | Serve the production build               |
| `pnpm check`      | Format check, lint, typecheck, run tests |
| `pnpm lint[:fix]` | Lint with Oxlint                         |
| `pnpm format`     | Format with Oxfmt                        |
| `pnpm test`       | Vitest in watch mode                     |
| `pnpm icons`      | Regenerate app icons into `public/`      |

Add UI components with `pnpm dlx shadcn@latest add <component>`.

## Deploying

The app deploys as an assets-only Cloudflare Worker (`wrangler.jsonc`); unknown paths fall back to `index.html`.
Run `pnpm exec wrangler login` once, then `pnpm deploy`.

Canonical links, social cards, `robots.txt` and `sitemap.xml` use the production URL. Set `SITE_URL` when building (e.g. `SITE_URL=https://example.com pnpm deploy`); the default is in `vite.config.ts`. The social card image is `public/og-image.png`, a 1200×630 screenshot of the title screen (`src/render/TitleScreen.tsx`); retake it after changing that screen.

The README's screenshots and gameplay GIF live in `.github/readme/`. They were taken at 1440×900 from seeded debug runs (see below), with the red debug badge hidden; retake them when the desk or the screens change noticeably.

## App icons

The icon is pixel art in `scripts/icons/art.ts`. Edit the grid or palette, then run `pnpm icons` to rewrite the favicons (SVG, ICO), the Apple touch icon, the PWA icons (including a maskable one) and `manifest.webmanifest` in `public/`. The generator has no dependencies.

## Debugging: seed a run

Add seed options to the URL to start a run part-way through, e.g. `/?day=4&ticket=2&findings=1`:

| Option     | What it does                                                                          |
| ---------- | ------------------------------------------------------------------------------------- |
| `seed`     | The run's random seed, so the same tickets come up again (random if left out)         |
| `day`      | The day to land on, 1–10 (at its briefing unless another phase is given)              |
| `ticket`   | Visitors already seen today; lands mid-day, with the clock moved on                   |
| `findings` | Open audit findings (0–2), from wrong calls on the tickets just before the stop       |
| `phase`    | `briefing`, `working`, `coffee` (with the auditor), `dayEnd`, `lost` (audit) or `won` |
| `clock`    | Game time while working, e.g. `15:30`                                                 |

Earlier tickets are decided by the engine itself, so the log, clock and run report look like real play. The URL then drops to `?debug`, so a reload carries on where you left off. Debug runs save to their own slot and leave the real run alone; open the plain URL to get back to it.

In debug mode, `window.demands` drives the run from the browser console:

- `demands.state()`: the run as it stands
- `demands.answer()`: the right call on the ticket at the desk, with the reasons to decline
- `demands.seed({ day: 9, phase: "dayEnd" })`: replace the run with a seeded one
