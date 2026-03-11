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
