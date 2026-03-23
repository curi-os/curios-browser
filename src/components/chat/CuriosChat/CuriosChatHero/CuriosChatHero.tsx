import React from "react";

import CuriosIntroBubble from "../../CuriosIntroBubble";

export default function CuriosChatHero(props: { logoUrl: string; appName: string; isLight: boolean; compact?: boolean }) {
  const { logoUrl, appName, isLight, compact = false } = props;

  return (
    <div className={compact ? "flex flex-col items-center pt-1 sm:pt-2" : "flex flex-col items-center"}>
      <div className={compact ? "h-28 w-28 overflow-hidden rounded-[1.1rem] sm:h-32 sm:w-32" : "h-48 w-48 overflow-hidden rounded-xl"}>
        <img src={logoUrl} className="h-full w-full object-cover" alt={appName} />
      </div>
      <div className={compact ? "-mt-5 px-4 text-center text-sm font-semibold sm:-mt-6 sm:text-base" : "-mt-12 px-4 text-center text-lg font-semibold"}>
        <CuriosIntroBubble isLight={isLight} compact={compact} />
      </div>
    </div>
  );
}
