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
    description: "Access web content in real-time",
    enabled: true,
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
    description: "Manage your notes",
    enabled: false,
    icon: StickyNote,
  },
];
