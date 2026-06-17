import { defineTool } from "eve/tools";
import { z } from "zod";

async function probe(url: string) {
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { url, status: response.status, reachable: response.ok, authGated: [401, 402, 403].includes(response.status), latencyMs: Date.now() - started };
  } catch (error) {
    return { url, status: null, reachable: false, authGated: false, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

export default defineTool({
  description: "Probe public Ardea/Snapchain endpoints for reachability. Does not claim full sync health.",
  inputSchema: z.object({ includeRawNode: z.boolean().default(true) }),
  async execute({ includeRawNode }) {
    const urls = ["https://ardea.arcabot.ai"];
    if (includeRawNode) urls.push("http://209.97.147.208:3381/v1/info");
    return { checks: await Promise.all(urls.map(probe)), note: "Reachability is not full sync health. Check alive, connected, synced, and resourced separately." };
  },
});
