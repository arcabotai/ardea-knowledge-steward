import { defineTool } from "eve/tools";
import { z } from "zod";
import { correctedFdv, SNAP_PAIR_ADDRESS, SNAP_TOTAL_SUPPLY } from "../../lib/snap";

export default defineTool({
  description: "Fetch $SNAP market context from Dexscreener and calculate corrected FDV using the verified 200B supply.",
  inputSchema: z.object({}).default({}),
  async execute() {
    const url = `https://api.dexscreener.com/latest/dex/pairs/ethereum/${SNAP_PAIR_ADDRESS}`;
    const response = await fetch(url);
    const data = await response.json();
    const priceUsd = Number(data?.pair?.priceUsd || 0);
    return {
      source: url,
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
      correctedFdvUsd: Number.isFinite(priceUsd) ? correctedFdv(priceUsd) : null,
      verifiedTotalSupply: SNAP_TOTAL_SUPPLY,
      dexscreenerFdvUsd: data?.pair?.fdv ?? null,
      disclaimer: "Educational market context only, not financial advice. Dexscreener may report incorrect supply/FDV.",
    };
  },
});
