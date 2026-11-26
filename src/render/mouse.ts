import { load, press, release, setPath } from "button-sounds";

/** Josh Comeau's recording of a cheap bundled ASUS mouse, from `button-sounds`, served from `public/sounds`. */
const SOUND = "asus-mouse";

setPath(`${import.meta.env.BASE_URL}sounds`);

/** Fetch the samples ahead of the first click, so it isn't silent. */
export const loadMouse = () => load(SOUND);

/** Quiet, with a touch of pitch drift so repeated clicks don't sound like one sample on loop. */
const options = () => ({ volume: 0.35, playbackRate: 0.96 + Math.random() * 0.08 });

/**
 * The mouse button goes down now and comes back up on the next release anywhere, so dragging
 * off a window still clicks back up and a stray release that didn't start here stays silent.
 */
export function clickMouse() {
  press(SOUND, options());
  const done = new AbortController();
  const up = () => {
    done.abort();
    release(SOUND, options());
  };
  window.addEventListener("pointerup", up, { signal: done.signal });
  window.addEventListener("pointercancel", up, { signal: done.signal });
}
