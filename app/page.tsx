import { AskClient } from "./ask-client";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-10 md:px-8 md:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Ardea Knowledge Steward</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl">
              Public answers for Hypersnap, Snapchain, and Farcaster-fork builders.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Ask Ardea about protocol layers, node operations, QNS/recovery safety, $SNAP caveats, governance proposals, and builder paths. Answers are grounded in a Markdown knowledge bundle and include provenance labels.
            </p>
          </div>
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-7 text-cyan-50">
            <p className="font-semibold">Answer policy</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-cyan-50/90">
              <li>Verified vs inferred vs proposal-stage labels.</li>
              <li>No seed phrase, private-key, or recovery-phrase handling.</li>
              <li>No investment advice. Token data is educational and source-labelled.</li>
              <li>Farcaster compatibility without pretending farcaster.xyz is core infrastructure.</li>
            </ul>
          </div>
        </section>
        <AskClient />
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Protocol", "Farcaster protocol, Snapchain, signers, casts, and fork-compatible infrastructure."],
            ["Operators", "Node health framed as alive, connected, synced, and resourced — not lazy green-check theater."],
            ["Safety", "Recovery, QNS, token, and governance answers keep secrets private and status caveats visible."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-zinc-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
