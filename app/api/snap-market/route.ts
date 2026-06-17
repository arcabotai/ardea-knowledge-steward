import { NextResponse } from "next/server";
import { correctedFdv, SNAP_PAIR_ADDRESS, SNAP_PHASE_ONE_OPENED, SNAP_RETRO_REWARDS, SNAP_TOKEN_ADDRESS, SNAP_TOTAL_SUPPLY } from "@/lib/snap";

export const runtime = "nodejs";

export async function GET() {
  const url = `https://api.dexscreener.com/latest/dex/pairs/ethereum/${SNAP_PAIR_ADDRESS}`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    const data = await response.json();
    const pair = data?.pair;
    const priceUsd = Number(pair?.priceUsd || 0);
    return NextResponse.json({
      ok: true,
      tokenAddress: SNAP_TOKEN_ADDRESS,
      pairAddress: SNAP_PAIR_ADDRESS,
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
      correctedFdvUsd: Number.isFinite(priceUsd) ? correctedFdv(priceUsd) : null,
      verifiedTotalSupply: SNAP_TOTAL_SUPPLY,
      retroRewardsAllocation: SNAP_RETRO_REWARDS,
      phaseOneOpened: SNAP_PHASE_ONE_OPENED,
      dexscreenerFdvUsd: pair?.fdv ?? null,
      liquidityUsd: pair?.liquidity?.usd ?? null,
      volume24hUsd: pair?.volume?.h24 ?? null,
      priceChange24hPct: pair?.priceChange?.h24 ?? null,
      source: url,
      disclaimer: "Educational market context only, not financial advice. Dexscreener may report incorrect supply/FDV; corrected FDV uses the user-confirmed 200B supply.",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error), source: url }, { status: 502 });
  }
}
