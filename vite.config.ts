import { fileURLToPath, URL } from "node:url";

import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** Where the game is served, for canonical links, social cards and the sitemap. */
const SITE_URL = (process.env.SITE_URL ?? "https://demands-pls.demands-pls.workers.dev").replace(
  /\/$/,
  "",
);

/** Fills `%SITE_URL%` in index.html and writes robots.txt and sitemap.xml next to it. */
function seo(siteUrl: string): Plugin {
  return {
    name: "seo",
    transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl),
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source:
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
          `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
          `  <url>\n` +
          `    <loc>${siteUrl}/</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n` +
          `    <priority>1.0</priority>\n` +
          `    <image:image><image:loc>${siteUrl}/og-image.png</image:loc></image:image>\n` +
          `  </url>\n` +
          `</urlset>\n`,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    seo(SITE_URL),
    cloudflare(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { host: true, allowedHosts: true },
  test: {
    include: ["{src,scripts}/**/*.test.{ts,tsx}"],
  },
});
