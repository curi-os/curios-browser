import React from "react";

import SidebarHeader from "../../SidebarHeader";
import ContextList from "../../ContextList";
import type { ContextId, ContextItem, Ui } from "../../shared/types";

export default function CuriosChatMobileSidebar(props: {
  open: boolean;
  onClose: () => void;
  ui: Ui;
  activeContextMeta: ContextItem;
  activeContext: ContextId;
  onSelectContext: (id: ContextId) => void;
  onReset: () => void;
  sessionId: string;
  isLight: boolean;
}) {
  const { open, onClose, ui, activeContextMeta, activeContext, onSelectContext, onReset, sessionId, isLight } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`absolute left-0 top-0 h-full w-80 border-r ${ui.border} ${ui.panel}`}>
        <SidebarHeader onReset={onReset} onClose={onClose} activeContext={activeContextMeta} isLight={isLight} />
        <ContextList
          activeContext={activeContext}
          onSelect={(id) => {
            onSelectContext(id);
            onClose();
          }}
          ui={ui}
        />
        <div className={`mt-auto border-t ${ui.border} p-4 text-xs text-neutral-500`}>
          Session: <span className="font-mono">{sessionId}</span>
        </div>
      </div>
    </div>
  );
}
