# Tally Project Blueprint

## Step 1 - Chosen Vertical

**Vertical:** Independent accounting and bookkeeping firms (Vertical A).

Accounting firms spend hours triaging emails from clients. These emails range from invoice disputes and complaints to missing document submissions, referral introductions, and rescheduling requests. Manually cross-checking these queries against CRM records to identify client status, monthly fees, or outstanding paperwork is a tedious, error-prone workflow that slows down responses.

**Painful workflow:** Triaging client requests, reconciling details against CRM records (values, statuses, pending tasks), and drafting professional replies.

## Step 2 - Problem And Solution

```text
PROBLEM:
Bookkeepers receive messy, unstructured client emails requesting actions (e.g. disputing invoices, submitting tax info, rescheduling). To handle them, the bookkeeper must look up the client in the CRM, verify their monthly fee or billing status, check if there's any pending paperwork noted, detect inconsistencies (such as an incorrect dispute value), compile action items, and write a reply. Doing this for dozens of emails daily causes significant delays and administrative overhead.

SOLUTION:
Tally automates this workflow. It displays a triage board mapping: sender information, email intent, priority level, CRM reconciliation details (including client status and values), warning cards for discrepancies (like incorrect billing amounts or missing documents), interactive recommended action checklists, and instant copyable email drafts. It runs completely in-memory with a zero-database structure.

KEY AI CAPABILITY USED:
Email context extraction, CRM data reconciliation, and structured JSON generation via Llama-3.3-70b-versatile with Zod schema verification.
```

## Step 3 - Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js App Router with React and TypeScript | Ships a unified darkroom triage dashboard with responsive layouts and stateful checkbox tracking. |
| Backend | Next.js Route Handler | Performs in-memory CSV parsing and invokes the Groq API in a single server action. |
| AI Layer | Vercel AI SDK with Groq | Uses `generateObject` for strict validation matching `EmailAnalysisSchema`. |
| Storage | None | Reads static `crm_export.csv` and emails in-memory for security and zero database compliance. |
| Deployment | Vercel | Seamless serverless deploys with environment variable configuration. |

## Step 4 - File Structure

```text
xyloproject/
├── .env                                              # Local environment settings (GROQ API key)
├── PROJECT_BLUEPRINT.md                              # Up-to-date Tally system mapping
├── README.md                                         # Setup, usage, and local run guide
└── src/
    ├── app/
    │   ├── api/
    │   │   └── analyze/
    │   │       └── route.ts                          # POST endpoint handling JSON payloads and FormData
    │   ├── globals.css                               # Achromatic darkroom styling variables and elements
    │   ├── layout.tsx                                # Page meta shell
    │   └── page.tsx                                  # Renders the triage client interface
    ├── features/
    │   └── lease-review/
    │       ├── components/
    │       │   └── LeaseReviewClient.tsx             # Interactive sidebar queue, email panel, CRM reconciliation board
    │       ├── sample-emails.json                    # Compiled 14 messy email text inputs
    │       └── types.ts                              # EmailAnalysisSchema Zod structure
    └── server/
        ├── prompts/
        │   └── lease-analysis.ts                     # System prompts for Tally email classification
        └── services/
            ├── extract.ts                            # Raw text upload sanitization
            ├── lease-analysis.ts                     # CSV parsing, profile matching, and Llama call service
            └── rate-limit.ts                         # In-memory IP rate limiter
```

## Step 5 - Core AI Pipeline

```text
1. User clicks a pre-loaded sample email in the inbox list, or uploads a text file.
2. Frontend sends text payload to POST /api/analyze as a JSON request.
3. Backend parses `crm_export.csv` in-memory.
4. Backend matches sender names/emails to the CRM list, generating matched user context.
5. Content is sent to Groq:
   - System prompt instructs Llama to act as Tally, classify intents, cross-check fee values, detect discrepancies (e.g. paperwork pending, EIN errors, billing mismatches), compile checklist actions, and write an auto-reply.
   - User prompt passes the email text and the structured CRM records.
6. Groq returns validated JSON schema matching EmailAnalysisSchema.
7. Frontend renders the results board: badges, original email text, CRM reconciliation panel, checkable recommended action lists, and copyable reply drafts.
```
