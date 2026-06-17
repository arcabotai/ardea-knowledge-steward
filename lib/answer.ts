import { searchKnowledge } from "./knowledge";

export type ArdeaAnswer = {
  answer: string;
  confidence: "grounded" | "partial" | "unknown";
  labels: string[];
  sources: Array<{ id: string; title: string; status: string; href: string; snippet: string }>;
  safety: string[];
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

export function answerQuestion(question: string): ArdeaAnswer {
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
