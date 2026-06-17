"use client";

import { FormEvent, KeyboardEvent, ReactNode, useState } from "react";

type Source = {
  id: string;
  title: string;
  status: string;
  href: string;
  snippet: string;
  sourceUrl?: string;
};

type Answer = {
  answer: string;
  confidence: string;
  labels: string[];
  safety: string[];
  mode: "ai" | "retrieval-fallback";
  model: string | null;
  modelError?: string;
  sources: Source[];
};

type Turn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  answer?: Answer;
  pending?: boolean;
};

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function Markdown({ children }: { readonly children: string }) {
  const lines = children.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push(<p key={blocks.length} className="answer-heading">{inline(heading[2])}</p>);
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={blocks.length}>
          {items.map((item, index) => <li key={index}>{inline(item)}</li>)}
        </ul>,
      );
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(<p key={blocks.length}>{inline(paragraph.join(" "))}</p>);
  }

  return <>{blocks}</>;
}

function SourcePill({ source }: { readonly source: Source }) {
  const label = `${source.title} · ${source.status}`;
  const className = "rounded-full border border-[#ded6ca] px-3 py-1.5 text-xs text-[#5c554d] transition hover:border-[#bdb3a5] hover:bg-[#fbf5eb]";

  if (source.sourceUrl) {
    return (
      <a href={source.sourceUrl} target="_blank" rel="noreferrer" className={className} title={source.snippet}>
        {label}
      </a>
    );
  }

  return <span className={className} title={source.snippet}>{label}</span>;
}

function AssistantTurn({ turn }: { readonly turn: Turn }) {
  return (
    <article className="rounded-[1.5rem] border border-[#ded6ca] bg-[#fffaf2] p-5 shadow-[0_18px_55px_rgba(34,28,18,0.05)] md:p-6">
      {turn.pending ? (
        <p className="text-sm text-[#756f66]">Looking...</p>
      ) : (
        <div className="answer-markdown text-[15px] leading-7 text-[#25221d] md:text-base">
          <Markdown>{turn.content}</Markdown>
        </div>
      )}

      {turn.answer?.sources.length ? (
        <div className="mt-5 border-t border-[#eee5d9] pt-4">
          <div className="mb-2 text-xs text-[#8a8379]">Sources</div>
          <div className="flex flex-wrap gap-2">
            {turn.answer.sources.map((source) => <SourcePill key={source.id} source={source} />)}
          </div>
        </div>
      ) : null}

      {turn.answer?.modelError ? (
        <p className="mt-4 text-xs text-[#9b6a2f]">Model fallback: {turn.answer.modelError}</p>
      ) : null}
    </article>
  );
}

export function AskClient() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(nextQuestion = question) {
    const cleanQuestion = nextQuestion.trim();
    if (!cleanQuestion || loading) return;

    const history = messages
      .filter((turn) => !turn.pending)
      .map((turn) => ({ role: turn.role, content: turn.content }))
      .slice(-8);
    const userTurn: Turn = { id: id(), role: "user", content: cleanQuestion };
    const pendingTurn: Turn = { id: id(), role: "assistant", content: "Looking...", pending: true };

    setMessages((current) => [...current, userTurn, pendingTurn]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, history }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Ask failed");
      setMessages((current) => current.map((turn) => turn.id === pendingTurn.id
        ? { id: pendingTurn.id, role: "assistant", content: data.answer, answer: data }
        : turn));
    } catch (err) {
      setMessages((current) => current.filter((turn) => turn.id !== pendingTurn.id));
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
      {messages.length ? (
        <div className="mb-5 space-y-4">
          {messages.map((turn) => turn.role === "user" ? (
            <div key={turn.id} className="ml-auto max-w-[88%] rounded-[1.25rem] bg-[#171714] px-4 py-3 text-sm leading-6 text-[#fffaf2] md:max-w-[78%]">
              {turn.content}
            </div>
          ) : <AssistantTurn key={turn.id} turn={turn} />)}
        </div>
      ) : null}

      <form onSubmit={submit} className="rounded-[1.75rem] border border-[#ded6ca] bg-[#fffaf2] p-3 shadow-[0_24px_80px_rgba(34,28,18,0.08)]">
        <label className="sr-only" htmlFor="question">Ask Ardea</label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={messages.length ? "Ask a follow-up..." : "Ask a Hypersnap question..."}
          className="min-h-28 w-full resize-none rounded-[1.25rem] border-0 bg-transparent px-3 py-3 text-[17px] leading-7 text-[#171714] outline-none placeholder:text-[#aaa196]"
        />
        <div className="flex flex-col gap-3 border-t border-[#eee5d9] px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-[#8a8379]">
            <span>Press Cmd/Ctrl + Enter to ask.</span>
            {messages.length ? <button type="button" onClick={() => { setMessages([]); setError(null); }} className="underline decoration-[#c8beb0] underline-offset-4">New thread</button> : null}
          </div>
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
    </div>
  );
}
