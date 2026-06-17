import { generateText } from "ai";
import { loadKnowledge, searchKnowledge } from "./knowledge";

const DEFAULT_MODEL = "openai/gpt-5.4-mini";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ArdeaSource = {
  id: string;
  title: string;
  status: string;
  href: string;
  snippet: string;
  sourceUrl?: string;
};

export type ArdeaAnswer = {
  answer: string;
  confidence: "grounded" | "partial" | "unknown";
  labels: string[];
  sources: ArdeaSource[];
  safety: string[];
  mode: "ai" | "retrieval-fallback";
  model: string | null;
  modelError?: string;
};

function historyText(history: ChatMessage[]): string {
  return history
    .slice(-8)
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

function classify(question: string, history: ChatMessage[] = []): { labels: string[]; safety: string[] } {
  const q = `${historyText(history)}\n${question}`.toLowerCase();
  const labels = new Set<string>();
  const safety = new Set<string>();
  if (/seed|recovery|private key|phrase|qns|q name|wallet/.test(q)) {
    labels.add("identity/recovery");
    safety.add("Never paste seed phrases, recovery phrases, private keys, or signer secrets into chat, DMs, screenshots, or unverified sites.");
  }
  if (/(\$snap|hypria|\btoken\b|\bclaim\b|\bfdv\b|\bprice\b|\bairdrop\b|\breward\b|dexscreener|\bsupply\b)/.test(q)) {
    labels.add("tokenomics");
    safety.add("Educational only, not financial advice. Eligibility, supply, and claim state need current source verification.");
  }
  if (/node|server|setup|install|docker|sync|peer|lag|doctor|port|snapchain/.test(q)) labels.add("node-ops");
  if (/farcaster|fork|client|app|protocol|signer/.test(q)) labels.add("protocol");
  if (/fip|proposal|governance|validator|bridge/.test(q)) labels.add("governance");
  return { labels: [...labels], safety: [...safety] };
}

function searchQuery(question: string, history: ChatMessage[]): string {
  const prior = history
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content)
    .join(" ");
  return `${prior} ${question}`.trim();
}

function sourceFromHit(hit: ReturnType<typeof searchKnowledge>[number]): ArdeaSource {
  return {
    id: hit.id,
    title: hit.title,
    status: hit.status,
    href: hit.href,
    snippet: hit.snippet,
    sourceUrl: hit.sourceUrl,
  };
}

function baseAnswer(question: string, history: ChatMessage[] = []): Omit<ArdeaAnswer, "mode" | "model" | "modelError"> {
  const rawHits = searchKnowledge(searchQuery(question, history), 6);
  const filteredHits = rawHits.filter((hit) => hit.id !== "index" && !hit.id.startsWith("sources/"));
  const hits = (filteredHits.length ? filteredHits : rawHits).slice(0, 4);
  const { labels, safety } = classify(question, history);
  if (hits.length === 0) {
    return {
      confidence: "unknown",
      labels,
      safety,
      sources: [],
      answer: "I don't have enough grounded Hypersnap context to answer that cleanly yet. Ask for a source link, or route this to a human steward before treating it as operational guidance.",
    };
  }

  const top = hits[0];
  const answer = [
    top.description || top.snippet,
    "",
    ...hits.slice(0, 3).map((hit) => `- ${hit.title}: ${hit.snippet}`),
    safety.length ? `\nSafety: ${safety.join(" ")}` : "",
  ].filter(Boolean).join("\n");

  return {
    confidence: hits.length >= 2 ? "grounded" : "partial",
    labels,
    safety,
    sources: hits.map(sourceFromHit),
    answer,
  };
}

export function answerQuestion(question: string, history: ChatMessage[] = []): ArdeaAnswer {
  return { ...baseAnswer(question, history), mode: "retrieval-fallback", model: null };
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
  const docs = new Map(loadKnowledge().map((doc) => [doc.id, doc]));
  return answer.sources
    .map((source, index) => {
      const body = docs.get(source.id)?.body || source.snippet;
      const content = body.replace(/\n{3,}/g, "\n\n").slice(0, 2400);
      return [
        `SOURCE ${index + 1}: ${source.title}`,
        `id: ${source.id}`,
        `status: ${source.status}`,
        source.sourceUrl ? `url: ${source.sourceUrl}` : null,
        "content:",
        content,
      ].filter(Boolean).join("\n");
    })
    .join("\n\n---\n\n");
}

function safeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 360);
}

function stripModelSources(text: string): string {
  return text
    .replace(/\n+\*\*Sources\*\*\s*:?[\s\S]*$/i, "")
    .replace(/\n+Sources\s*:?[\s\S]*$/i, "")
    .trim();
}

export async function answerQuestionWithModel(question: string, history: ChatMessage[] = []): Promise<ArdeaAnswer> {
  const fallback = baseAnswer(question, history);

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
        maxOutputTokens: 850,
        timeout: 20_000,
        system: [
          "You are Ardea, the Hypersnap field desk for builders and node operators.",
          "Answer using only the provided source context and the recent conversation. If the source context is thin, say what is unknown. If it is enough, answer directly.",
          "Keep Farcaster protocol, Farcaster app/client, Snapchain, Hypersnap, node ops, tokenomics, QNS/recovery, and governance layers separate.",
          "Never ask for seed phrases, recovery phrases, private keys, app signer secrets, or screenshots of secrets.",
          "For $SNAP/Hypria/token/price/claim questions: educational only, no investment advice, no guaranteed rewards, and mention source/currentness caveats.",
          "Do not make farcaster.xyz, hosted APIs, Mini Apps, or Farcaster Snaps sound like permanent core Hypersnap infrastructure unless the source says so.",
          "Do not include a Sources section. Do not list source ids in the answer. The UI renders sources separately.",
          "Style: plain, useful, operator-friendly. No SaaS copy. No 'as an AI' voice. If giving server steps, prefer a short checklist and exact commands from the sources.",
        ].join("\n"),
        prompt: [
          history.length ? `Recent conversation:\n${historyText(history)}` : "Recent conversation: none yet.",
          "",
          `Current question: ${question}`,
          "",
          `Layer labels: ${fallback.labels.length ? fallback.labels.join(", ") : "general"}`,
          fallback.safety.length ? `Safety notes to preserve: ${fallback.safety.join(" ")}` : "Safety notes: none triggered by classifier.",
          "",
          "Source context:",
          sourceContext(fallback),
        ].join("\n"),
      });

      const trimmed = stripModelSources(text.trim());
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
