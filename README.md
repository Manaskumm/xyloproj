# LedgerSync: AI Email Triage & CRM Reconciliation

LedgerSync is a smart AI-powered inbox triage and CRM reconciliation tool designed specifically for **independent accounting and bookkeeping firms** (Vertical A). It parses unstructured, messy client emails (disputes, referrals, tax queries) and automatically reconciles them against a CRM records export (`crm_export.csv`), identifying intent, priority level, matching client records, finding billing discrepancies, establishing action items, and drafting professional email replies.

## What It Does

1. **Email Triage & Parsing:** Classifies client intents into categories like invoice disputes, complaints, documentation requests, general queries, and new client referrals. It automatically assigns priorities (High, Medium, Low) based on date urgency and sentiment.
2. **CRM Reconciliation:** Matches senders against the CSV database via email, name fallback, or context matching. It flags discrepancies, such as:
   - Invoice amount mismatches (e.g. client disputing a charge where the invoiced fee does not match the CRM value).
   - Status warnings (e.g., active vs negotiating, new lead, or churned account).
   - Missing paperwork or tax document packages noted in CRM notes.
3. **Interactive Action Plan:** Creates a list of task checkboxes (e.g., update client invoice value, follow up on EIN forms, email bank loan officer) for the accountant to track their work.
4. **Draft Auto-Replies:** Drafts professional, client-ready responses addressing the client's query, acknowledging issues, and prompting them for missing details.
5. **Interactive Sample Inbox:** Preloads all 14 messy client emails from the Xylo AI Studios sample dataset directly into the side panel for quick one-click testing, alongside a drag-and-drop file upload zone.

## Tech Stack

- **Framework:** Next.js App Router (React, TypeScript)
- **AI Integration:** Vercel AI SDK with Groq (Llama-3.3-70b-versatile)
- **Validation:** Zod schemas for structured output validation
- **Styling:** Vanilla CSS, high-contrast dark-mode theme, sharp corners (`0px`), rounded pills (`75px`)
- **Storage:** Stateless, zero-database (processes CSV and email data in-memory)

## Getting Started

### Prerequisites

- Node.js 18+ or 22+
- npm 10+
- Groq API Key

### Installation

1. Clone or download the repository files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   Create a `.env` file in the root directory (or copy `.env.example` to `.env.local` or `.env`):
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

### Run Locally

Start the development server:
```bash
npm run dev
```

Open `http://localhost:3000` (or `http://127.0.0.1:3000`) in your browser.

## How to Test

1. Launch the app.
2. The left panel shows the **Triage Inbox Queue** populated with 14 sample emails from Xylo AI Studios' dataset.
3. Click any email from the list (e.g., *Ray Delgado*, *marcy h*, or *Tina*).
4. The system will parse the email text, match it with `crm_export.csv`, run AI triage, and render:
   - The original email content.
   - Categorized intent and priority badges.
   - Executive summary of the email query.
   - **CRM Verification card** showing client details and highlighting any discrepancy (e.g., invoice fee mismatch, missing prior returns, error in EIN submission).
   - Recommended actions with checkable items.
   - A copyable email reply draft.
5. You can also upload your own `.txt` emails using the drop zone.

## Deployment

Deploy directly to Vercel as a standard Next.js application. Configure `GROQ_API_KEY` in the environment variables settings on Vercel.
