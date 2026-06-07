import { z } from "zod";

export const EmailAnalysisSchema = z.object({
  senderName: z.string(),
  senderEmail: z.string(),
  company: z.string(),
  intent: z.enum(["invoice_dispute", "new_lead_referral", "document_request", "project_update", "general_query", "complaint"]),
  priority: z.enum(["low", "medium", "high"]),
  executiveSummary: z.string(),
  crmMatch: z.object({
    clientId: z.string().nullable(),
    matchedName: z.string().nullable(),
    status: z.string().nullable(),
    crmValue: z.string().nullable(),
    discrepancyFound: z.boolean(),
    discrepancyDetails: z.string().nullable()
  }),
  actionItems: z.array(z.string()),
  draftReply: z.string(),
  disclaimer: z.string()
});

export type EmailAnalysis = z.infer<typeof EmailAnalysisSchema>;
