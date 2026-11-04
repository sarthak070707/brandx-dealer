import { z } from "zod";
import type { Complete } from "@/lib/ai/generate";

// Groq speaks the OpenAI chat format, so any compatible provider works by changing these.
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
// For reasoning models this budget also covers the thinking, so it is generous.
const MAX_COMPLETION_TOKENS = 1_200;

// gpt-oss models always reason before answering; "low" keeps that short and the reply quick.
const isReasoningModel = (model: string) => model.startsWith("openai/gpt-oss");

const completionSchema = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1) });

// Called from the server only, so the key never reaches the browser.
export const completeWithGroq: Complete = async (messages, signal) => {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("LLM_API_KEY is not set");

  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const response = await fetch(`${process.env.LLM_BASE_URL || DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      response_format: { type: "json_object" },
      ...(isReasoningModel(model) && { reasoning_effort: "low" }),
    }),
    signal,
  });
  if (!response.ok) throw new Error(`The AI request failed with status ${response.status}`);

  return completionSchema.parse(await response.json()).choices[0].message.content;
};
