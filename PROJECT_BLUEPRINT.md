# Cairn Project Blueprint

## Step 1 - Chosen Vertical

**Vertical:** Real estate property management.

Property managers handle repetitive, document-heavy lease reviews but often do not have legal operations staff or expensive lease abstraction software. AI can turn a dense lease or renewal packet into structured dates, obligations, risk flags, and follow-up actions in minutes.

**Painful workflow:** Lease abstraction and renewal risk review for uploaded PDF, DOCX, or TXT lease documents.

## Step 2 - Problem And Solution

```text
PROBLEM:
Property managers and small real estate operators manually read leases to find renewal deadlines, rent escalations, notice windows, operating expense obligations, maintenance duties, and risky ambiguity. This can take 30-90 minutes per document, misses can trigger missed notice dates or bad renewal terms, and smaller teams often cannot justify enterprise lease administration platforms.

SOLUTION:
Cairn lets a user upload a lease document and returns a structured review packet: executive summary, critical dates, financial terms, party obligations, risk flags, missing information, and a renewal action plan. The user experiences a simple upload-to-review workflow with no database or setup beyond an OpenAI API key.

KEY AI CAPABILITY USED:
Document text extraction plus LLM structured extraction with Zod schema validation.
```

## Step 3 - Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js App Router with React and TypeScript | Ships a polished upload and results UI in one project with strong type safety. |
| Backend | Next.js Route Handler | Keeps the AI endpoint and frontend together for fast solo-developer iteration. |
| AI Layer | Vercel AI SDK with OpenAI | Provides `generateObject` for schema-constrained JSON output and easy provider configuration. |
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
1. User uploads a PDF, DOCX, or TXT lease document via the frontend.
2. Frontend sends it as FormData to POST /api/analyze.
3. Backend validates file type and size, then extracts raw text using pdf-parse, mammoth, or File.text().
4. Extracted content is passed to OpenAI through the Vercel AI SDK:
   - System prompt: defines Cairn as a property-manager lease abstraction assistant, forbids guessing, and requires non-legal-advice framing.
   - User prompt: includes prompt version, file name, and extracted document text.
5. AI returns schema-constrained JSON matching LeaseAnalysisSchema.
6. Backend returns the validated object with model, prompt version, and token usage.
7. Frontend renders the result as a review packet with summary, dates, terms, obligations, risks, missing information, and renewal actions.
```

## Step 6 - Environment

```bash
# AI Provider
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
