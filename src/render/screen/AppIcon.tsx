import { slug } from "@/lib/slug";

/** One pixel-art tile per app, drawn by `pnpm icons` (scripts/icons/apps.ts). */
const ICONS = import.meta.glob<string>("./app-icons/*.svg", { eager: true, import: "default" });

/** An app's icon tile, or nothing for an app the generator hasn't drawn. */
export function AppIcon({ name }: { name: string }) {
  const src = ICONS[`./app-icons/${slug(name)}.svg`];
  return src ? <img className="office-app-icon" src={src} alt="" /> : null;
}
