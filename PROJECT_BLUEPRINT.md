# Cairn Project Blueprint

## Step 1 - Chosen Vertical

**Vertical:** Specialty trade contractors (flooring, HVAC, roofing, plumbing, electrical).

Subcontractors and specialty trade firms handle complex, document-heavy contracts and specification packages from General Contractors (GCs) or developers. They often do not have dedicated legal departments to highlight dangerous clauses (like pay-if-paid clauses or short notice windows for change orders/delays) or keep track of key milestones, retainage rules, and referenced spec sections. AI can analyze these documents in minutes, delivering a clear summary of operational terms and risks.

**Painful workflow:** Subcontract agreement and bid specification review for uploaded PDF, DOCX, or TXT documents.

## Step 2 - Problem And Solution

```text
PROBLEM:
Specialty trade contractors manually read subcontracts and bid documents to locate payment terms, retainage requirements, billing deadlines, warranty liabilities, milestone schedules, and high-risk clauses (such as pay-if-paid conditions). Missing these dates or terms can trigger severe financial losses or liquidated damages, while hiring external legal counsel for every bid is cost-prohibitive.

SOLUTION:
Cairn allows subcontractors to upload a contract or bid package and returns a structured review board: executive summary, milestones and deadlines, financial/billing conditions, obligations, risk flags, missing specification files, and a negotiation strategy plan. The user gets a zero-database, zero-setup, direct upload-to-review workflow.

KEY AI CAPABILITY USED:
Document text extraction and LLM structured extraction with Zod schema validation.
```

## Step 3 - Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js App Router with React and TypeScript | Ships a polished upload and results UI in one project with strong type safety. |
| Backend | Next.js Route Handler | Keeps the AI endpoint and frontend together for fast solo-developer iteration. |
| AI Layer | Vercel AI SDK with Groq / OpenAI | Provides `generateObject` for schema-constrained JSON output and easy provider configuration. |
| Storage | None for v1 | Uploaded documents are processed in memory and not persisted, reducing compliance and setup burden. |
| Auth | None for v1 | The first useful prototype can run locally or behind a private deployment without account flows. |
| Deployment | Vercel | Natural fit for Next.js, environment variables, and route handlers. |

## Step 4 - File Structure

```text
cairn/
├── .env.example                                      # Required environment variables with placeholder values
├── .gitignore                                        # Local, build, and secret files excluded from git
├── PROJECT_BLUEPRINT.md                              # Product and implementation blueprint generated from the mapper prompt
├── README.md                                         # Setup, usage, and deployment instructions
├── next-env.d.ts                                     # Next.js TypeScript environment declarations
├── next.config.ts                                    # Next.js configuration
├── package.json                                      # Scripts and dependencies
├── tsconfig.json                                     # TypeScript compiler options and path aliases
└── src/
    ├── app/
    │   ├── api/
    │   │   └── analyze/
    │   │       └── route.ts                          # POST endpoint that extracts text and runs AI analysis
    │   ├── globals.css                               # Application styling
    │   ├── layout.tsx                                # Root metadata and HTML shell
    │   └── page.tsx                                  # Main page route
    ├── features/
    │   └── lease-review/
    │       ├── components/
    │       │   └── LeaseReviewClient.tsx             # Upload UI and structured review rendering
    │       └── types.ts                              # Zod schemas and TypeScript types for AI output
    └── server/
        ├── prompts/
        │   └── lease-analysis.ts                     # Versioned system prompt
        └── services/
            ├── extract.ts                            # PDF, DOCX, and TXT text extraction
            ├── lease-analysis.ts                     # Vercel AI SDK `generateObject` integration
            └── rate-limit.ts                         # Minimal in-memory request limiter
```

## Step 5 - Core AI Pipeline

```text
1. User uploads a PDF, DOCX, or TXT subcontract or spec document via the frontend.
2. Frontend sends it as FormData to POST /api/analyze.
3. Backend validates file type and size, then extracts raw text using pdf-parse, mammoth, or File.text().
4. Extracted content is passed to Groq through the Vercel AI SDK:
   - System prompt: defines Cairn as a subcontract review assistant for specialty trades, alerts on delay notice windows, pay-if-paid terms, and retainage, and restricts output to supplied text.
   - User prompt: includes prompt version, file name, and extracted document text.
5. AI returns schema-constrained JSON matching ContractAnalysisSchema.
6. Backend returns the validated object.
7. Frontend renders the result as a review board containing executive summary, milestones, financial terms, obligations, risks, missing specifications, and negotiation plans.
```

## Step 6 - Environment

```bash
# AI Provider
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# App
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```
