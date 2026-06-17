import { defineTool } from "eve/tools";
import { z } from "zod";
import { answerQuestion } from "../../lib/answer";

export default defineTool({
  description: "Draft a grounded Ardea answer with provenance labels and safety warnings from the local knowledge bundle.",
  inputSchema: z.object({ question: z.string().min(1) }),
  execute({ question }) {
    return answerQuestion(question);
  },
  toModelOutput(output) {
    return { type: "text", value: output.answer };
  },
});
