# Cairn

> Lease abstraction and renewal risk review for property managers.

## What It Does

Cairn turns lease PDFs, DOCX files, and plain text documents into a structured review packet. It extracts critical dates, financial terms, obligations, renewal steps, risk flags, and missing information so property teams can move faster without pretending the output is legal advice.

## Tech Stack

- Next.js App Router
- React and TypeScript
- Vercel AI SDK
- OpenAI
- Zod
- pdf-parse and mammoth

## Setup

### Prerequisites

- Node.js 22+
- npm 10+
- OpenAI API key

### Installation

```bash
npm install
cp .env.example .env.local
```

Fill in `OPENAI_API_KEY` in `.env.local`.

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

If `localhost` does not resolve in your browser, open `http://127.0.0.1:3000`.

## Usage

1. Upload a PDF, DOCX, or TXT lease document.
2. Click `Analyze Lease`.
3. Review the generated packet for dates, terms, obligations, risks, missing information, and renewal actions.
4. Send high-risk or ambiguous items to counsel or the relevant property stakeholder for confirmation.

## Deployment

Deploy to Vercel as a standard Next.js application. Add `OPENAI_API_KEY`, optionally set `OPENAI_MODEL`, and keep upload limits aligned with your hosting plan.

## Notes

Documents are processed in memory and are not written to a database in this scaffold. The output is operational guidance, not legal advice.
