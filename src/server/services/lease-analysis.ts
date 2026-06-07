import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { EmailAnalysisSchema } from "@/features/lease-review/types";
import { LEASE_ANALYSIS_PROMPT } from "@/server/prompts/lease-analysis";
import fs from "fs";
import path from "path";

export interface CRMRecord {
  clientId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  lastContact: string;
  value: string;
  notes: string;
}

export function loadCRMRecords(): CRMRecord[] {
  try {
    const csvPath = path.join(process.cwd(), "sample-data", "sample-data", "crm_export.csv");
    if (!fs.existsSync(csvPath)) {
      console.warn("CRM CSV file not found at primary path, checking fallback...");
      const fallbackPath = path.join(process.cwd(), "sample-data", "crm_export.csv");
      if (!fs.existsSync(fallbackPath)) {
        console.error("CRM CSV file not found anywhere!");
        return [];
      }
      return parseCSV(fs.readFileSync(fallbackPath, "utf-8"));
    }
    return parseCSV(fs.readFileSync(csvPath, "utf-8"));
  } catch (error) {
    console.error("Error loading CRM records:", error);
    return [];
  }
}

function parseCSV(content: string): CRMRecord[] {
  const lines = content.split(/\r?\n/);
  const records: CRMRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parser supporting double quotes
    const cells: string[] = [];
    let currentCell = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    
    if (cells.length >= 9) {
      records.push({
        clientId: cells[0] || "",
        name: cells[1] || "",
        company: cells[2] || "",
        email: cells[3] || "",
        phone: cells[4] || "",
        status: cells[5] || "",
        lastContact: cells[6] || "",
        value: cells[7] || "",
        notes: cells[8] || ""
      });
    }
  }
  return records;
}

export async function analyzeContractText(input: { text: string; fileName: string; customCrmRecords?: CRMRecord[] }) {
  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const crmRecords = input.customCrmRecords || loadCRMRecords();

  const { object, usage } = await generateObject({
    model: groq(modelName),
    schema: EmailAnalysisSchema,
    system: LEASE_ANALYSIS_PROMPT.system,
    providerOptions: {
      groq: {
        structuredOutputs: false
      }
    },
    prompt: [
      `Prompt version: ${LEASE_ANALYSIS_PROMPT.version}`,
      `File name: ${input.fileName}`,
      "Here is the CRM export context (JSON format):",
      JSON.stringify(crmRecords, null, 2),
      "Analyze the following incoming client email, reconcile it against the CRM list above, check for discrepancies (such as billing differences, missing paperwork flags, or mismatching values/statuses), and return the requested JSON structure.",
      "Email content:",
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

