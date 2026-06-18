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
  const checks = await Promise.all([probe("https://ardea.arcabot.ai")]);
  return NextResponse.json({
    ok: true,
    checks,
    node: {
      name: "hypersnap-ardea",
      status: "retired",
      retiredAt: "2026-06-18T23:15:00Z",
      note: "The former Arca-operated public Snapchain node was decommissioned to stop DigitalOcean compute and block-storage billing.",
    },
    note: "Ardea remains a Hypersnap field desk. It no longer advertises a live Arca-operated node endpoint.",
  });
}
