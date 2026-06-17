import { defineAgent } from "eve";

export default defineAgent({
  model: process.env.ARDEA_MODEL || "openai/gpt-5.4-mini",
});
