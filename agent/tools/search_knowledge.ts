import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchKnowledge } from "../../lib/knowledge";

export default defineTool({
  description: "Search the local Ardea OKF-style knowledge bundle and return cited snippets.",
  inputSchema: z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(8).default(5) }),
  execute({ query, limit }) {
    return { results: searchKnowledge(query, limit) };
  },
  toModelOutput(output) {
    return { type: "json", value: output.results.map((r) => ({ id: r.id, title: r.title, status: r.status, snippet: r.snippet })) };
  },
});
