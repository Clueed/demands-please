import { snapPath } from "./pixel";

/** A filled shape snapped to the shared art grid. */
export function Px({ d, fill, className }: { d: string; fill: string; className?: string }) {
  return <path d={snapPath(d)} fill={fill} className={className} />;
}
