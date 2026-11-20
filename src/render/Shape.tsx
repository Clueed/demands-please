import { cn } from "@/lib/utils";

import { boundingRect, gamePx, rectStyle, type Points } from "./layout";

/**
 * A grey polygon standing in for art drawn in perspective. Points are game pixels
 * relative to the game window; `label` names what goes here.
 */
export function Shape({
  label,
  points,
  className,
}: {
  label: string;
  points: Points;
  className?: string;
}) {
  const box = boundingRect(points);
  const corners = points.map(([x, y]) => `${gamePx(x - box.x)} ${gamePx(y - box.y)}`);

  return (
    <div
      data-placeholder={label}
      className={cn(
        "absolute flex items-center justify-center bg-neutral-400 text-game-sm text-neutral-500 uppercase",
        className,
      )}
      style={{ ...rectStyle(box), clipPath: `polygon(${corners.join(", ")})` }}
    >
      {label}
    </div>
  );
}
