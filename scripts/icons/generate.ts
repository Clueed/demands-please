/**
 * Writes every app icon into `public/` from the pixel art in `art.ts`.
 *
 *   pnpm icons
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ART, BACKGROUND, PALETTE, opaque, padded } from "./art.ts";
import { encodeIco, encodePng, encodeSvg, rasterize } from "./encode.ts";

const out = join(import.meta.dirname, "../../public");
const solid = PALETTE.b;

const files: Record<string, string | Buffer> = {
  "favicon.svg": encodeSvg(ART, PALETTE),
  "favicon.ico": encodeIco([16, 32, 48].map((size) => rasterize(ART, PALETTE, size))),
  "apple-touch-icon.png": encodePng(rasterize(opaque(ART), PALETTE, 180, solid)),
  "icon-192.png": encodePng(rasterize(ART, PALETTE, 192)),
  "icon-512.png": encodePng(rasterize(ART, PALETTE, 512)),
  "icon-maskable-512.png": encodePng(rasterize(padded(ART, 4), PALETTE, 512, solid)),
  "manifest.webmanifest": `${JSON.stringify(
    {
      name: "Demands, Please",
      short_name: "Demands",
      start_url: "/",
      display: "standalone",
      background_color: BACKGROUND,
      theme_color: BACKGROUND,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    null,
    2,
  )}\n`,
};

await mkdir(out, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  await writeFile(join(out, name), contents);
  console.log(`public/${name}`);
}
