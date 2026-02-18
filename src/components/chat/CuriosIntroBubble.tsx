import React from "react";

export default function CuriosIntroBubble({ isLight }: { isLight: boolean }) {
  const bubbleClass = isLight
    ? "border border-neutral-200 bg-neutral-100 text-neutral-900"
    : "border border-neutral-800 bg-neutral-900 text-neutral-100";

  return (
    <div className="mx-auto w-full max-w-xl mb-12">
      <div className={["rounded-2xl px-5 py-4 text-sm leading-relaxed text-center", bubbleClass].join(" ")}>
        <div className={isLight ? "text-neutral-700" : "text-neutral-500"}>
          CuriOS is a conversational operating system.
        </div>
      </div>
    </div>
  );
}
