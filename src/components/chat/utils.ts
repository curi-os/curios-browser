export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/\./g, "_");
}

function titleCaseFromIdentifier(value: string) {
  const words = value
    .trim()
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean);

  const upperWords = new Set(["ai", "id", "oauth", "api", "url"]);

  return words
    .map((w) => {
      if (upperWords.has(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

const SESSION_STATE_LABELS: Record<string, string> = {
  // Common states / variants (keep keys normalized).
  ready: "Ready",
  initialized: "Ready",
  init: "Starting",
  starting: "Starting",
  booting: "Starting",
  bootstrap: "Starting",
  bootstrapping: "Starting",
  loading: "Loading",
  connecting: "Connecting",
  connected: "Connected",
  authenticated: "Signed in",
  unauthenticated: "Guest",
  needs_auth: "Sign-in required",
  needs_login: "Sign-in required",
  needs_provider: "AI provider required",
  provider_required: "AI provider required",
  provider_not_configured: "AI provider not configured",
  error: "Error",
};

export function getSessionStateLabel(state: string | null | undefined) {
  if (!state) return "Welcome";
  const key = normalizeKey(state);
  return SESSION_STATE_LABELS[key] ?? titleCaseFromIdentifier(state);
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  azure_openai: "Azure OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  gemini: "Google Gemini",
  xai: "xAI",
  mistral: "Mistral",
  ollama: "Ollama",
};

export function getProviderLabel(provider: string | null | undefined) {
  if (!provider) return "";
  const key = normalizeKey(provider);
  return PROVIDER_LABELS[key] ?? titleCaseFromIdentifier(provider);
}
