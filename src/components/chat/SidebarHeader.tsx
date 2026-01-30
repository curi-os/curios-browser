import React from "react";
import curiosLogoWhiteUrl from "../../images/curios-logo-white.png";

export default function SidebarHeader({
  onReset,
  onClose,
}: {
  onReset: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <img
              className="h-10 w-10 rounded-2xl bg-neutral-200 dark:bg-neutral-800"
              src={curiosLogoWhiteUrl}
              alt="CuriOS logo"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">CuriOS</div>
            <div className="text-xs text-neutral-400">contexts</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              Close
            </button>
          )}
          <button
            onClick={onReset}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
            title="Restart local session"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-neutral-300">
        Context: You are now on <span className="text-neutral-500 dark:text-neutral-300">System</span>.
      </div>
    </div>
  );
}
