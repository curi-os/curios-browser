export const API_BASE = (process.env.REACT_APP_API_BASE as string) || "http://localhost:8787";

export const SYSTEM_CONTEXT_HELP =
  "System context is the default assistant mode for onboarding and account setup.\n\n" +
  "Use it to sign up/sign in, manage your session, and configure/select an AI provider.\n\n" +
  "It does not read your current page or workspace files.";
