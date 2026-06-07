import { z } from "zod";

export const EmailAnalysisSchema = z.object({
  senderName: z.string().min(1),
  senderEmail: z.string().min(1),
  company: z.string(),
  intent: z.enum(["invoice_dispute", "new_lead_referral", "document_request", "project_update", "general_query", "complaint"]),
  priority: z.enum(["low", "medium", "high"]),
  executiveSummary: z.string().min(1),
  crmMatch: z.object({
    clientId: z.string().nullable(),
    matchedName: z.string().nullable(),
    status: z.string().nullable(),
    crmValue: z.string().nullable(),
    discrepancyFound: z.boolean(),
    discrepancyDetails: z.string().nullable()
  }),
  actionItems: z.array(z.string().min(1)),
  draftReply: z.string().min(1),
  disclaimer: z.string().min(1)
});

export type EmailAnalysis = z.infer<typeof EmailAnalysisSchema>;
