import { z } from "zod";

export const LeaseRiskSchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  issue: z.string().min(1),
  whyItMatters: z.string().min(1),
  recommendedAction: z.string().min(1)
});

export const LeaseAnalysisSchema = z.object({
  documentType: z.string().min(1),
  tenant: z.string().min(1),
  property: z.string().min(1),
  leaseStatus: z.string().min(1),
  executiveSummary: z.string().min(1),
  criticalDates: z.array(
    z.object({
      label: z.string().min(1),
      date: z.string().min(1),
      action: z.string().min(1)
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
  risks: z.array(LeaseRiskSchema),
  renewalPlan: z.array(z.string().min(1)),
  missingInformation: z.array(z.string().min(1)),
  disclaimer: z.string().min(1)
});

export type LeaseAnalysis = z.infer<typeof LeaseAnalysisSchema>;
