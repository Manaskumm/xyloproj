import { z } from "zod";

export const ContractRiskSchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  issue: z.string().min(1),
  whyItMatters: z.string().min(1),
  recommendedAction: z.string().min(1)
});

export const ContractAnalysisSchema = z.object({
  documentType: z.string().min(1),
  generalContractor: z.string().min(1),
  projectName: z.string().min(1),
  tradeCategory: z.string().min(1),
  executiveSummary: z.string().min(1),
  milestones: z.array(
    z.object({
      label: z.string().min(1),
      date: z.string().min(1),
      actionRequired: z.string().min(1)
    })
  ),
  financialTerms: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      note: z.string().min(1)
    })
  ),
  obligations: z.array(
    z.object({
      party: z.string().min(1),
      obligation: z.string().min(1),
      timing: z.string().min(1)
    })
  ),
  risks: z.array(ContractRiskSchema),
  negotiationPlan: z.array(z.string().min(1)),
  missingSpecs: z.array(z.string().min(1)),
  disclaimer: z.string().min(1)
});

export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;
