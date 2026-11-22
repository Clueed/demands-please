import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

import { control } from "../styles";

/** "Are you sure?" before throwing away the run, which is the only one. Over the whole desktop. */
export function ConfirmRestart({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title = "Restart game";
  return (
    <div className="office-overlay absolute inset-0 z-[120] grid place-items-center">
      <section className="office-window office-sheet flex flex-col" aria-label={title}>
        <div className="office-titlebar flex shrink-0 items-center px-4">{title}</div>
        <div className="flex flex-col gap-3 p-4">
          <p>Start a new run from day 1? This run's progress and findings are gone for good.</p>
          <div className="flex gap-2 self-end">
            <button className={cn(control, "office-next")} onClick={onCancel} autoFocus>
              Keep playing
            </button>
            <button className={cn(control, "office-decline")} onClick={onConfirm}>
              <RotateCcw aria-hidden="true" /> Restart
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
