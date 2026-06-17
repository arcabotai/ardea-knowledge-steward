import { AskClient } from "./ask-client";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#171714]">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-6 md:px-8">
        <header className="flex items-center justify-between text-sm text-[#6d675e]">
          <p className="font-medium text-[#24211d]">Ardea</p>
          <p>Hypersnap field desk</p>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 md:py-20">
          <div className="mb-7 max-w-2xl">
            <h1 className="text-4xl font-medium tracking-[-0.04em] text-[#171714] md:text-6xl">Ask Ardea.</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#6d675e] md:text-lg">
              Ask about Hypersnap, Snapchain, Farcaster forks, node ops, recovery safety, or $SNAP caveats. Ardea answers with sources when it has them.
            </p>
          </div>

          <AskClient />
        </section>

        <footer className="pb-2 text-xs leading-5 text-[#8a8379]">
          Do not paste seed phrases, private keys, recovery phrases, or signer secrets. Ever.
        </footer>
      </div>
    </main>
  );
}
