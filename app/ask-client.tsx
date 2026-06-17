"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { Streamdown } from "streamdown";

type Answer = {
  answer: string;
  confidence: string;
  labels: string[];
  safety: string[];
  mode: "ai" | "retrieval-fallback";
  model: string | null;
  modelError?: string;
  sources: Array<{ id: string; title: string; status: string; href: string; snippet: string }>;
};

export function AskClient() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(nextQuestion = question) {
    const cleanQuestion = nextQuestion.trim();
    if (!cleanQuestion || loading) return;

    setQuestion(cleanQuestion);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion }),
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void ask();
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={submit} className="rounded-[1.75rem] border border-[#ded6ca] bg-[#fffaf2] p-3 shadow-[0_24px_80px_rgba(34,28,18,0.08)]">
        <label className="sr-only" htmlFor="question">Ask Ardea</label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a Hypersnap question..."
          className="min-h-32 w-full resize-none rounded-[1.25rem] border-0 bg-transparent px-3 py-3 text-[17px] leading-7 text-[#171714] outline-none placeholder:text-[#aaa196]"
        />
        <div className="flex flex-col gap-3 border-t border-[#eee5d9] px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#8a8379]">Press Cmd/Ctrl + Enter to ask.</p>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-full bg-[#171714] px-5 py-2.5 text-sm font-medium text-[#fffaf2] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Asking" : "Ask"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}

      {answer ? (
        <section className="mt-8 rounded-[1.75rem] border border-[#ded6ca] bg-[#fffaf2] p-5 shadow-[0_24px_80px_rgba(34,28,18,0.06)] md:p-7">
          <article className="answer-markdown text-[15px] leading-7 text-[#25221d] md:text-base">
            <Streamdown mode="static">{answer.answer}</Streamdown>
          </article>

          <div className="mt-6 border-t border-[#eee5d9] pt-4">
            <details className="group">
              <summary className="cursor-pointer list-none text-sm text-[#756f66] marker:hidden">
                <span className="border-b border-[#c8beb0]">Sources</span>
                <span className="ml-2 text-xs text-[#aaa196]">{answer.sources.length || "none"}</span>
              </summary>
              <div className="mt-4 space-y-3">
                {answer.sources.map((source) => (
                  <div key={source.id} className="rounded-2xl border border-[#eee5d9] bg-[#fbf5eb] p-4">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-[#25221d]">{source.title}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a8379]">{source.status}</p>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#756f66]">{source.id}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5c554d]">{source.snippet}</p>
                  </div>
                ))}
              </div>
            </details>
            <p className="mt-4 text-xs text-[#aaa196]">
              {answer.mode === "ai" ? "AI answer" : "Fallback answer"} · {answer.confidence}
              {answer.modelError ? ` · model fallback: ${answer.modelError}` : ""}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
