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
  description: "Check the public Ardea field-desk site and report that the old Arca-operated Snapchain node is retired.",
  inputSchema: z.object({ includeRawNode: z.boolean().default(false) }),
  async execute() {
    const checks = await Promise.all([probe("https://ardea.arcabot.ai")]);
    return {
      checks,
      node: {
        name: "hypersnap-ardea",
        status: "retired",
        retiredAt: "2026-06-18T23:15:00Z",
        note: "The former public node endpoint at 209.97.147.208:3381 was decommissioned to stop DigitalOcean compute and block-storage billing.",
      },
      note: "Ardea is now a knowledge/field desk, not a live Arca-operated Snapchain node status page.",
    };
  },
});
