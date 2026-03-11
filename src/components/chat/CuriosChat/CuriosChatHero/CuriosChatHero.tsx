import React from "react";

import CuriosIntroBubble from "../../CuriosIntroBubble";

export default function CuriosChatHero(props: { logoUrl: string; appName: string; isLight: boolean }) {
  const { logoUrl, appName, isLight } = props;

  return (
    <div className="flex flex-col items-center">
      <div className="h-48 w-48 overflow-hidden rounded-xl">
        <img src={logoUrl} className="h-full w-full object-cover" alt={appName} />
      </div>
      <div className="-mt-12 px-4 text-center text-lg font-semibold">
        <CuriosIntroBubble isLight={isLight} />
      </div>
    </div>
  );
}
