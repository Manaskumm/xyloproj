# Cairn

> Subcontract agreement and bid specification review for specialty trade contractors (flooring, HVAC, roofing).

## What It Does

Cairn turns subcontract PDFs, DOCX files, and plain text specifications into a structured review board. It extracts key milestones, retainage rules, billing cycles, party obligations, missing specs, and high-risk contracting clauses (like pay-if-paid terms or short notice windows for schedule adjustments) so subcontractors can bid and negotiate confidently.

## Tech Stack

- Next.js App Router
- React and TypeScript
- Vercel AI SDK
- Groq AI (llama-3.3-70b-versatile)
- Zod
- pdf-parse and mammoth

## Setup

### Prerequisites

- Node.js 22+
- npm 10+
- Groq API key

### Installation

```bash
npm install
cp .env.example .env.local
```

Fill in `GROQ_API_KEY` in `.env.local`.

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

If `localhost` does not resolve in your browser, open `http://127.0.0.1:3000`.

## Usage

1. Upload a PDF, DOCX, or TXT subcontract or spec document.
2. Click `Analyze Contract`.
3. Review the generated board for milestones, payment terms, subcontractor/GC obligations, contractual risks, missing specs, and recommended negotiation points.
4. Export or use high-risk items during negotiation sessions with the General Contractor before signing.

## Deployment

Deploy to Vercel as a standard Next.js application. Add `GROQ_API_KEY`, optionally set `GROQ_MODEL`, and verify file size limit rules on Next.js serverless functions.

## Notes

Documents are processed in memory and are not written to a database in this scaffold. The output is operational guidance, not legal advice.
