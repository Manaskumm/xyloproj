"use client";

import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  DollarSign,
  FileCheck2,
  FileText,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { LeaseAnalysis } from "@/features/lease-review/types";

type AnalyzeResponse = {
  analysis: LeaseAnalysis;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  promptVersion: string;
};

export function LeaseReviewClient() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError("");
    }
  };

  const fileMeta = useMemo(() => {
    if (!file) {
      return "PDF, DOCX, or TXT up to 8 MB";
    }

    const mb = (file.size / 1024 / 1024).toFixed(2);
    return `${file.name} (${mb} MB)`;
  }, [file]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a lease document first.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed.");
      }

      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell" id="main-content">
      <a className="skip-link" href="#review-packet">
        Skip to Review Desk
      </a>
      <div className="workspace">
        <aside className="sidebar">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true">
              <FileText size={21} strokeWidth={2.3} />
            </span>
            <p className="eyebrow" translate="no">
              Cairn
            </p>
          </div>
          <h1>Lease Review Desk</h1>
          <p className="lead">
            Turn a lease or renewal packet into the dates, money terms, obligations, risk flags,
            and renewal actions your team needs to act on.
          </p>

          <form onSubmit={handleSubmit}>
            <label 
              className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {isLoading && <div className="scanning-beam" />}
              <span className="upload-icon" aria-hidden="true">
                <UploadCloud size={28} />
              </span>
              <strong>{file ? "Ready to Analyze" : "Choose Lease Document"}</strong>
              <span>{fileMeta}</span>
              <span className="file-trigger">Browse Files</span>
              <input
                className="file-input"
                name="lease-document"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setResult(null);
                  setError("");
                }}
              />
            </label>

            <div className="button-row">
              <button className="primary-button" type="submit" disabled={isLoading}>
                <FileCheck2 size={18} aria-hidden="true" />
                {isLoading ? "Analyzing…" : "Analyze Lease"}
              </button>
            </div>
          </form>

          {error ? <div className="error">{error}</div> : null}

          <div className="meta-list" aria-label="Workflow notes">
            <div className="meta-item">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Extraction runs server-side for PDF, DOCX, and plain text files.</span>
            </div>
            <div className="meta-item">
              <ClipboardList size={18} aria-hidden="true" />
              <span>Every review is validated against a structured schema before it renders.</span>
            </div>
            <div className="meta-item">
              <FileCheck2 size={18} aria-hidden="true" />
              <span>No database is used in this scaffold; documents are not persisted.</span>
            </div>
          </div>
        </aside>

        <section className="results" id="review-packet" aria-live="polite">
          <div className="results-header">
            <div>
              <p className="eyebrow">Review Desk</p>
              <h2>{result ? result.analysis.documentType : "No document loaded"}</h2>
            </div>
            {result ? (
              <span className="pill" translate="no">
                {result.model}
              </span>
            ) : (
              <span className="pill">Draft</span>
            )}
          </div>

          {!result ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <ClipboardList size={34} />
              </div>
              <h2>Your review packet will land here.</h2>
              <p>
                Cairn organizes the lease into dated actions, financial terms, obligations, risk
                flags, and missing information.
              </p>
            </div>
          ) : (
            <AnalysisView result={result} />
          )}
        </section>
      </div>
    </main>
  );
}

function AnalysisView({ result }: { result: AnalyzeResponse }) {
  const { analysis } = result;

  return (
    <div className="results-body">
      <div className="section full">
        <h2>
          <FileCheck2 size={18} aria-hidden="true" />
          Executive Summary
        </h2>
        <p className="value">{analysis.executiveSummary}</p>
        <ul className="kv-list">
          <li>
            <span className="label">Tenant</span>
            <span className="value">{analysis.tenant}</span>
          </li>
          <li>
            <span className="label">Property</span>
            <span className="value">{analysis.property}</span>
          </li>
          <li>
            <span className="label">Lease Status</span>
            <span className="value">{analysis.leaseStatus}</span>
          </li>
        </ul>
      </div>

      <div className="grid">
        <div className="section">
          <h2>
            <CalendarClock size={18} aria-hidden="true" />
            Critical Dates
          </h2>
          {analysis.criticalDates.length ? (
            <ul className="kv-list">
              {analysis.criticalDates.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <span className="label">{item.label}</span>
                <span className="value">{item.date}</span>
                <span className="value">{item.action}</span>
              </li>
              ))}
            </ul>
          ) : (
            <EmptyLine />
          )}
        </div>

        <div className="section">
          <h2>
            <DollarSign size={18} aria-hidden="true" />
            Financial Terms
          </h2>
          {analysis.financialTerms.length ? (
            <ul className="kv-list">
              {analysis.financialTerms.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <span className="label">{item.label}</span>
                <span className="value">{item.value}</span>
                <span className="value">{item.note}</span>
              </li>
              ))}
            </ul>
          ) : (
            <EmptyLine />
          )}
        </div>

        <div className="section full">
          <h2>
            <AlertTriangle size={18} aria-hidden="true" />
            Risk Flags
          </h2>
          {analysis.risks.length ? (
            <div className="kv-list">
              {analysis.risks.map((risk, index) => (
              <article className={`risk ${risk.level}`} key={`${risk.issue}-${index}`}>
                <div className="risk-top">
                  <h3>{risk.issue}</h3>
                  <span className="risk-level">{risk.level}</span>
                </div>
                <p className="value">{risk.whyItMatters}</p>
                <p className="value">
                  <strong>Action:</strong> {risk.recommendedAction}
                </p>
              </article>
              ))}
            </div>
          ) : (
            <EmptyLine />
          )}
        </div>

        <div className="section">
          <h2>
            <ClipboardList size={18} aria-hidden="true" />
            Obligations
          </h2>
          {analysis.obligations.length ? (
            <ul className="kv-list">
              {analysis.obligations.map((item, index) => (
              <li key={`${item.party}-${index}`}>
                <span className="label">{item.party}</span>
                <span className="value">{item.obligation}</span>
                <span className="value">{item.timing}</span>
              </li>
              ))}
            </ul>
          ) : (
            <EmptyLine />
          )}
        </div>

        <div className="section">
          <h2>
            <ShieldCheck size={18} aria-hidden="true" />
            Renewal Plan
          </h2>
          {analysis.renewalPlan.length ? (
            <ol className="clean-list">
              {analysis.renewalPlan.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ol>
          ) : (
            <EmptyLine />
          )}
        </div>

        <div className="section full">
          <h2>
            <FileText size={18} aria-hidden="true" />
            Missing Information
          </h2>
          {analysis.missingInformation.length ? (
            <ul className="clean-list">
              {analysis.missingInformation.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <EmptyLine />
          )}
        </div>
      </div>

      <div className="notice">{analysis.disclaimer}</div>
      <p className="label">
        Prompt {result.promptVersion}; {result.usage.totalTokens.toLocaleString()} total tokens.
      </p>
    </div>
  );
}

function EmptyLine() {
  return <p className="empty-line">No items were returned for this section.</p>;
}
