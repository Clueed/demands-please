import { snapPath } from "./pixel";

/** A filled shape snapped to the shared art grid. */
export function Px({ d, fill }: { d: string; fill: string }) {
  return <path d={snapPath(d)} fill={fill} />;
}
