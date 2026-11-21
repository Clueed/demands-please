import { useEffect, useState } from "react";

import { Px } from "./Px";

const SHADOW = "#9f8462";
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const LETTERS = [
  ["Backquote", ...range(9).map((i) => `Digit${i + 1}`), "Digit0", "Minus", "Equal", "Backspace"],
  [
    "Tab",
    ..."QWERTYUIOP".split("").map((c) => `Key${c}`),
    "BracketLeft",
    "BracketRight",
    "Backslash",
  ],
  [
    "CapsLock",
    ..."ASDFGHJKL".split("").map((c) => `Key${c}`),
    "Semicolon",
    "Quote",
    "Enter",
    "ShiftRight",
  ],
];
const NUMPAD = [
  ["Numpad7", "Numpad8", "Numpad9"],
  ["Numpad4", "Numpad5", "Numpad6"],
  ["Numpad1", "Numpad2", "Numpad3"],
];

type Key = { code: string; x: number; y: number; w: number; fill: string; down: string };
const KEYS: Key[] = [
  ...LETTERS.flatMap((row, r) =>
    row.map((code, k) => ({
      code,
      x: 4 + k * 10 - r * 2,
      y: 2 + r * 4,
      w: 8,
      fill: "#b9c0aa",
      down: "#7f8a78",
    })),
  ),
  ...NUMPAD.flatMap((row, r) =>
    row.map((code, k) => ({
      code,
      x: 152 + k * 10 - r * 2,
      y: 2 + r * 4,
      w: 8,
      fill: "#a6b39e",
      down: "#74816f",
    })),
  ),
  { code: "Space", x: 38, y: 14, w: 74, fill: "#a6b39e", down: "#74816f" },
];
const CODES = new Set(KEYS.map((k) => k.code));

function withKey(held: ReadonlySet<string>, code: string, down: boolean) {
  if (held.has(code) === down) return held;
  const next = new Set(held);
  if (down) next.add(code);
  else next.delete(code);
  return next;
}

/**
 * Keyboard: top face with keys, a dark front edge. Every key goes down under the pointer,
 * and also when you type on your real keyboard. Caps Lock lights the little lamp.
 */
export function Keyboard() {
  const [held, setHeld] = useState<ReadonlySet<string>>(new Set());
  const [caps, setCaps] = useState(false);
  const press = (code: string, down: boolean) => setHeld((prev) => withKey(prev, code, down));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") setCaps(e.getModifierState("CapsLock"));
      const code = e.code;
      if (CODES.has(code)) setHeld((prev) => withKey(prev, code, e.type === "keydown"));
    };
    const clear = () => setHeld(new Set());
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return (
    <g>
      <Px d="M-4 4h188l8 22H-12Z" fill={SHADOW} />
      <Px d="M-8 18h204v4H-8Z" fill="#283634" />
      <Px d="M0 0h188l8 18H-8Z" fill="#53615a" />
      <Px d="M0 0h188v2H0Z" fill="#879084" />
      {KEYS.map((key) => {
        const down = held.has(key.code);
        return (
          <g
            key={key.code}
            className="keycap"
            // The press also reaches the keyboard itself, so it can be dragged by its keys;
            // the key comes back up wherever the pointer is let go.
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              press(key.code, true);
              if (key.code === "CapsLock") setCaps((c) => !c);
              const up = () => press(key.code, false);
              window.addEventListener("pointerup", up, { once: true });
              window.addEventListener("pointercancel", up, { once: true });
            }}
          >
            {/* A generous invisible hit area, the caps themselves are tiny. */}
            <rect x={key.x - 1} y={key.y - 1} width={key.w + 2} height="4" fill="transparent" />
            {/* The cap's lit top edge, gone while it is held down. */}
            {!down && <Px d={`M${key.x} ${key.y}h${key.w}v2h-${key.w}Z`} fill={key.fill} />}
            {down && <Px d={`M${key.x} ${key.y}h${key.w}v2h-${key.w}Z`} fill={key.down} />}
          </g>
        );
      })}
      <Px d="M180 2h2v2h-2Z" fill={caps ? "#e4f5b8" : "#6f7d62"} />
    </g>
  );
}
