import { Px } from "../Px";
import { paint, type Look } from "./look";
import type { Shape } from "./parts";

/** Draws a part's shapes in this look's colours. */
export function Shapes({ look, shapes }: { look: Look; shapes: readonly Shape[] }) {
  return shapes.map(([tone, d], i) => <Px key={i} d={d} fill={paint(look, tone)} />);
}
