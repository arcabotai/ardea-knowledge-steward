import { generateText } from "ai";
import { searchKnowledge } from "./knowledge";

const DEFAULT_MODEL = "openai/gpt-5.4-mini";

export type ArdeaAnswer = {
  answer: string;
  confidence: "grounded" | "partial" | "unknown";
  labels: string[];
  sources: Array<{ id: string; title: string; status: string; href: string; snippet: string }>;
  safety: string[];
  mode: "ai" | "retrieval-fallback";
  model: string | null;
  modelError?: string;
};

function classify(question: string): { labels: string[]; safety: string[] } {
  const q = question.toLowerCase();
  const labels = new Set<string>();
  const safety = new Set<string>();
  if (/seed|recovery|private key|phrase|qns|q name|wallet/.test(q)) {
    labels.add("identity/recovery");
    safety.add("Never paste seed phrases, recovery phrases, private keys, or signer secrets into chat, DMs, screenshots, or unverified sites.");
  }
  if (/snap|hypria|token|claim|fdv|price|airdrop|reward/.test(q)) {
    labels.add("tokenomics");
    safety.add("Educational only, not financial advice. Eligibility, supply, and claim state need current source verification.");
  }
  if (/node|sync|peer|lag|doctor|port|snapchain/.test(q)) labels.add("node-ops");
  if (/farcaster|fork|client|app|protocol|signer/.test(q)) labels.add("protocol");
  if (/fip|proposal|governance|validator|bridge/.test(q)) labels.add("governance");
  return { labels: [...labels], safety: [...safety] };
}

function baseAnswer(question: string): Omit<ArdeaAnswer, "mode" | "model" | "modelError"> {
  const hits = searchKnowledge(question, 4);
  const { labels, safety } = classify(question);
  if (hits.length === 0) {
    return {
      confidence: "unknown",
      labels,
      safety,
      sources: [],
      answer: "I don't have enough grounded Hypersnap/Farcaster-fork context in the current Ardea bundle to answer that cleanly yet. Ask for a source link, or route this to a human steward before treating it as operational guidance.",
    };
  }

  const top = hits[0];
  const sourceLines = hits.map((hit, i) => `${i + 1}. ${hit.title} (${hit.status})`).join("\n");
  const answer = [
    `Short answer: ${top.description || top.snippet}`,
    "",
    "How Ardea frames it:",
    ...hits.slice(0, 3).map((hit) => `- **${hit.title}** — ${hit.snippet}`),
    "",
    labels.length ? `Layer labels: ${labels.join(", ")}.` : "Layer labels: general ecosystem context.",
    safety.length ? `Safety: ${safety.join(" ")}` : "Safety: no special secret-handling or token-risk warning triggered by this question.",
    "",
    `Sources:\n${sourceLines}`,
  ].join("\n");

  return {
    confidence: hits.length >= 2 ? "grounded" : "partial",
    labels,
    safety,
    sources: hits.map((hit) => ({ id: hit.id, title: hit.title, status: hit.status, href: hit.href, snippet: hit.snippet })),
    answer,
  };
}

export function answerQuestion(question: string): ArdeaAnswer {
  return { ...baseAnswer(question), mode: "retrieval-fallback", model: null };
}

function aiEnabled(): boolean {
  return process.env.ARDEA_DISABLE_AI !== "1" && process.env.ARDEA_AI_ENABLED !== "0";
}

function modelCandidates(): string[] {
  const configured = (process.env.ARDEA_MODEL || DEFAULT_MODEL)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const fallbacks = ["openai/gpt-5.4-mini", "openai/gpt-5.4-nano", "anthropic/claude-haiku-4.5"];
  return [...new Set([...configured, ...fallbacks])];
}

function sourceContext(answer: Omit<ArdeaAnswer, "mode" | "model" | "modelError">): string {
  return answer.sources
    .map((source, index) => [
      `SOURCE ${index + 1}: ${source.title}`,
      `id: ${source.id}`,
      `status: ${source.status}`,
      `snippet: ${source.snippet}`,
    ].join("\n"))
    .join("\n\n");
}

function safeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 360);
}

export async function answerQuestionWithModel(question: string): Promise<ArdeaAnswer> {
  const fallback = baseAnswer(question);

  if (!aiEnabled() || fallback.sources.length === 0) {
    return { ...fallback, mode: "retrieval-fallback", model: null };
  }

  let lastModel = modelCandidates()[0] || DEFAULT_MODEL;
  let lastError: unknown;

  for (const model of modelCandidates()) {
    lastModel = model;
    try {
      const { text } = await generateText({
        model,
        temperature: 0.2,
        maxOutputTokens: 700,
        timeout: 20_000,
        system: [
          "You are Ardea, the Hypersnap knowledge steward for builders and node operators.",
          "Answer using only the provided source context. If the context is thin, say what is unknown and route to a human/source.",
          "Keep Farcaster protocol, Farcaster app/client, Snapchain, Hypersnap, node ops, tokenomics, QNS/recovery, and governance layers separate.",
          "Never ask for seed phrases, recovery phrases, private keys, app signer secrets, or screenshots of secrets.",
          "For $SNAP/Hypria/token/price/claim questions: educational only, no investment advice, no guaranteed rewards, and mention source/currentness caveats.",
          "Do not make farcaster.xyz, hosted APIs, Mini Apps, or Farcaster Snaps sound like permanent core Hypersnap infrastructure unless the source says so.",
          "Format: direct answer first, then bullets, then 'Sources' with source ids in brackets. Keep it concise but actually helpful.",
        ].join("\n"),
        prompt: [
          `Question: ${question}`,
          "",
          `Layer labels: ${fallback.labels.length ? fallback.labels.join(", ") : "general"}`,
          fallback.safety.length ? `Safety notes to preserve: ${fallback.safety.join(" ")}` : "Safety notes: none triggered by classifier.",
          "",
          "Source context:",
          sourceContext(fallback),
        ].join("\n"),
      });

      const trimmed = text.trim();
      return {
        ...fallback,
        answer: trimmed || fallback.answer,
        mode: "ai",
        model,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ...fallback,
    mode: "retrieval-fallback",
    model: lastModel,
    modelError: safeError(lastError),
  };
}
