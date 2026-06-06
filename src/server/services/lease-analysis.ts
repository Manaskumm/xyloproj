import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { LeaseAnalysisSchema } from "@/features/lease-review/types";
import { LEASE_ANALYSIS_PROMPT } from "@/server/prompts/lease-analysis";

export async function analyzeLeaseText(input: { text: string; fileName: string }) {
  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const { object, usage } = await generateObject({
    model: groq(modelName),
    schema: LeaseAnalysisSchema,
    system: LEASE_ANALYSIS_PROMPT.system,
    providerOptions: {
      groq: {
        structuredOutputs: false
      }
    },
    prompt: [
      `Prompt version: ${LEASE_ANALYSIS_PROMPT.version}`,
      `File name: ${input.fileName}`,
      "Analyze the following lease document text and return the requested JSON structure.",
      "Document text:",
      input.text
    ].join("\n\n"),
    temperature: 0.2
  });

  return {
    analysis: object,
    usage: {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0
    },
    promptVersion: LEASE_ANALYSIS_PROMPT.version,
    model: modelName
  };
}
