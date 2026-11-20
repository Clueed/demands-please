# demands-pls

A simple single-player, client-side web game (later with a global leaderboard hosted on Cloudflare).

## Stack

- **Vite 8** + **React 19** + **TypeScript**
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

Add UI components with `pnpm dlx shadcn@latest add <component>`.

## Deploying

The app deploys as an assets-only Cloudflare Worker (`wrangler.jsonc`); unknown paths fall back to `index.html`.
Run `pnpm exec wrangler login` once, then `pnpm deploy`.
