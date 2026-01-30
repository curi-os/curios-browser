import type { ContextItem } from "./types";

export const CONTEXTS: ContextItem[] = [
  {
    id: "system",
    label: "System",
    description: "Onboarding, account and AI providers",
    enabled: true,
  },
  {
    id: "browser",
    label: "Browser",
    description: "Current page: read, summarize, save",
    enabled: false,
  },
  {
    id: "files",
    label: "Files",
    description: "Workspace and files",
    enabled: false,
  },
  {
    id: "notes",
    label: "Notes",
    description: "Knowledge base",
    enabled: false,
  },
];
