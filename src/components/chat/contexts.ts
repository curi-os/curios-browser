import type { ContextItem } from "./types";

import { Folder, Globe, Settings, StickyNote } from "lucide-react";

export const CONTEXTS: ContextItem[] = [
  {
    id: "system",
    label: "System",
    description: "Onboarding, account and AI providers",
    enabled: true,
    icon: Settings,
  },
  {
    id: "browser",
    label: "Browser",
    description: "Current page: read, summarize, save",
    enabled: false,
    icon: Globe,
  },
  {
    id: "files",
    label: "Files",
    description: "Workspace and files",
    enabled: false,
    icon: Folder,
  },
  {
    id: "notes",
    label: "Notes",
    description: "Knowledge base",
    enabled: false,
    icon: StickyNote,
  },
];
