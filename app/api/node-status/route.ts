import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function probe(url: string) {
  const started = Date.now();
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return {
      url,
      status: response.status,
      reachable: response.ok,
      authGated: [401, 402, 403].includes(response.status),
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return { url, status: null, reachable: false, authGated: false, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function GET() {
  const checks = await Promise.all([
    probe("https://ardea.arcabot.ai"),
    probe("http://209.97.147.208:3381/v1/info"),
  ]);
  return NextResponse.json({ ok: true, checks, note: "Reachability is not full sync health. Alive, connected, synced, and resourced must be checked separately." });
}
