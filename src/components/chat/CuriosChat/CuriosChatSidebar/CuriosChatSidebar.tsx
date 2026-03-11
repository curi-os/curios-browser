import React from "react";

import SidebarHeader from "../../SidebarHeader";
import ContextList from "../../ContextList";
import type { ContextId, ContextItem, Ui } from "../../shared/types";

export default function CuriosChatSidebar(props: {
  ui: Ui;
  activeContextMeta: ContextItem;
  activeContext: ContextId;
  onSelectContext: (id: ContextId) => void;
  onReset: () => void;
  sessionId: string;
  isLight: boolean;
}) {
  const { ui, activeContextMeta, activeContext, onSelectContext, onReset, sessionId, isLight } = props;

  return (
    <aside className={`hidden w-80 flex-col overflow-hidden border-r ${ui.border} ${ui.panel} md:flex`}>
      <SidebarHeader onReset={onReset} activeContext={activeContextMeta} isLight={isLight} />
      <div className="flex-1 overflow-y-auto">
        <ContextList activeContext={activeContext} onSelect={onSelectContext} ui={ui} />
      </div>
      <div className={`mt-auto border-t ${ui.border} p-4 text-xs text-neutral-500`}>
        Session: <span className="font-mono">{sessionId}</span>
      </div>
    </aside>
  );
}
