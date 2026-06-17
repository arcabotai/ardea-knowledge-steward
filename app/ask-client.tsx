"use client";

import { useState } from "react";

type Answer = {
  answer: string;
  confidence: string;
  labels: string[];
  safety: string[];
  sources: Array<{ id: string; title: string; status: string; href: string; snippet: string }>;
};

const examples = [
  "What is Hypersnap and how is it related to Farcaster?",
  "How do I tell if a Snapchain node is actually healthy?",
  "What should I know before recovering a Q name?",
  "Why can Dexscreener FDV be wrong for $SNAP?",
];

export function AskClient() {
  const [question, setQuestion] = useState(examples[0]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(nextQuestion = question) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Ask failed");
      setAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 md:p-6">
      <div className="flex flex-wrap gap-2 pb-4">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => { setQuestion(example); void ask(example); }}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-left text-xs text-cyan-100 transition hover:bg-cyan-300/20"
          >
            {example}
          </button>
        ))}
      </div>
      <label className="block text-sm font-medium text-zinc-200" htmlFor="question">Ask Ardea</label>
      <div className="mt-2 flex flex-col gap-3 md:flex-row">
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-24 flex-1 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none ring-cyan-400/40 placeholder:text-zinc-500 focus:ring-2"
        />
        <button
          onClick={() => void ask()}
          disabled={loading}
          className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </div>
      {error ? <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      {answer ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
          <article className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-6 text-zinc-100">{answer.answer}</article>
          <aside className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Confidence</p>
              <p className="mt-1 font-semibold text-cyan-100">{answer.confidence}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-zinc-500">Labels</p>
              <p className="mt-1 text-sm text-zinc-200">{answer.labels.length ? answer.labels.join(", ") : "general"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Sources</p>
              <div className="mt-3 space-y-3">
                {answer.sources.map((source) => (
                  <div key={source.id} className="rounded-xl bg-white/[0.04] p-3">
                    <p className="font-medium text-zinc-100">{source.title}</p>
                    <p className="text-xs text-cyan-200">{source.status} · {source.id}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{source.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
