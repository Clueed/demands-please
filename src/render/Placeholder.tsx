import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { rectStyle, type Rect } from "./layout";

/**
 * A grey box standing in for art that doesn't exist yet. `label` names what goes here.
 * Positioned absolutely at `rect` (game pixels). Other props go to the div.
 */
export function Placeholder({
  label,
  rect,
  className,
  style,
  children,
  ...props
}: ComponentProps<"div"> & { label: string; rect: Rect }) {
  return (
    <div
      data-placeholder={label}
      className={cn(
        "game-border absolute flex flex-col bg-neutral-300 text-neutral-800",
        className,
      )}
      style={{ ...rectStyle(rect), ...style }}
      {...props}
    >
      <div className="px-1 text-game-sm text-neutral-500 uppercase">{label}</div>
      {children}
    </div>
  );
}
