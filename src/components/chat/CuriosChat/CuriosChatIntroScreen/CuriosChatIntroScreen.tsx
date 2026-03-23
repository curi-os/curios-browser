import React from "react";

import CuriosChatHero from "../CuriosChatHero";
import type { Ui } from "../../shared/types";

function IntroAlert(props: {
  title: string;
  details: string;
  ui: Ui;
}) {
  const { title, details, ui } = props;

  return (
    <div className={`rounded-2xl ${ui.assistantBubble} px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}>
      <strong>{title}</strong>
      <div className="mt-2">{details}</div>
    </div>
  );
}

export default function CuriosChatIntroScreen(props: {
  ui: Ui;
  isLight: boolean;
  logoUrl: string;
  appName: string;
  welcomeContent: React.ReactNode;
  composer: React.ReactNode;
  toolbar?: React.ReactNode;
  sessionError?: string | null;
  historyError?: string | null;
}) {
  const {
    ui,
    isLight,
    logoUrl,
    appName,
    welcomeContent,
    composer,
    toolbar,
    sessionError,
    historyError,
  } = props;

  return (
    <div className={`min-h-screen ${ui.app}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-1 sm:px-6 sm:py-2">
        <div className="flex min-h-6 items-center justify-end gap-2">{toolbar}</div>

        <div className="w-full pt-0 pb-4 sm:pb-6">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="curios-logo-intro">
              <CuriosChatHero logoUrl={logoUrl} appName={appName} isLight={isLight} compact />
            </div>

            <div className="mx-auto mt-3 w-full max-w-[1040px] space-y-3">
              {sessionError ? <IntroAlert title="Failed to load session." details={sessionError} ui={ui} /> : null}
              {historyError ? <IntroAlert title="Failed to load message history." details={historyError} ui={ui} /> : null}
              {welcomeContent}
            </div>

            <div className="mx-auto mt-4 w-full max-w-[1040px]">{composer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
