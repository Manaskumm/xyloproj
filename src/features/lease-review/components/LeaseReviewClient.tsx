"use client";

import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  DollarSign,
  FileCheck2,
  FileText,
  ShieldCheck,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { ContractAnalysis } from "@/features/lease-review/types";

type AnalyzeResponse = {
  analysis: ContractAnalysis;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  promptVersion: string;
};

export function LeaseReviewClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Record<string, AnalyzeResponse>>({});
  const [fileStatuses, setFileStatuses] = useState<Record<string, "ready" | "analyzing" | "completed" | "failed">>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
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

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const filesArray = Array.from(newFiles);

    setFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map((f) => f.name));
      const filteredNew = filesArray.filter((f) => !existingNames.has(f.name));
      const updatedFiles = [...prevFiles, ...filteredNew];

      setFileStatuses((prevStatuses) => {
        const updatedStatuses = { ...prevStatuses };
        filteredNew.forEach((f) => {
          updatedStatuses[f.name] = "ready";
        });
        return updatedStatuses;
      });

      return updatedFiles;
    });
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setFileStatuses((prev) => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
    setResults((prev) => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });

    setActiveTab((prev) => {
      if (prev === fileName) {
        const remaining = Object.keys(results).filter((name) => name !== fileName);
        return remaining.length > 0 ? remaining[0] : null;
      }
      return prev;
    });
  };

  const fileMeta = useMemo(() => {
    if (files.length === 0) {
      return "PDF, DOCX, or TXT up to 8 MB";
    }
    return `${files.length} file${files.length > 1 ? "s" : ""} selected`;
  }, [files]);

  const activeResult = useMemo(() => {
    return activeTab ? results[activeTab] : null;
  }, [activeTab, results]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pendingFiles = files.filter(
      (f) => fileStatuses[f.name] === "ready" || fileStatuses[f.name] === "failed"
    );

    if (pendingFiles.length === 0) {
      if (files.length === 0) {
        setError("Choose one or more contract documents first.");
      } else {
        setError("All selected files have already been analyzed.");
      }
      return;
    }

    setIsLoading(true);
    setError("");

    for (const file of pendingFiles) {
      setFileStatuses((prev) => ({ ...prev, [file.name]: "analyzing" }));

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

        setResults((prev) => ({ ...prev, [file.name]: payload }));
        setFileStatuses((prev) => ({ ...prev, [file.name]: "completed" }));
        setActiveTab((prev) => prev || file.name);
      } catch (caught) {
        setFileStatuses((prev) => ({ ...prev, [file.name]: "failed" }));
        setError(
          `Failed to analyze ${file.name}: ${
            caught instanceof Error ? caught.message : "unknown error"
          }`
        );
      }
    }

    setIsLoading(false);
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
          <h1>Subcontract Review Desk</h1>
          <p className="lead">
            Turn your subcontract agreements, bid packages, or supplier proposals into the scopes,
            payment schedules, milestones, and risk flags your team needs to review before bidding or signing.
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
              <strong>{files.length > 0 ? "Ready to Analyze" : "Choose Contract Documents"}</strong>
              <span>{fileMeta}</span>
              <span className="file-trigger">Browse Files</span>
              <input
                className="file-input"
                name="contract-documents"
                type="file"
                multiple
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => {
                  addFiles(event.target.files);
                }}
              />
            </label>

            <div className="button-row">
              <button className="primary-button" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                ) : (
                  <FileCheck2 size={18} aria-hidden="true" />
                )}
                {isLoading ? "Analyzing Queue…" : "Analyze Contracts"}
              </button>
            </div>
          </form>

          {error ? <div className="error">{error}</div> : null}

          {files.length > 0 && (
            <div className="file-queue">
              <h3 className="queue-title">Uploaded Contracts ({files.length})</h3>
              {files.map((f) => {
                const status = fileStatuses[f.name] || "ready";
                const sizeStr = (f.size / 1024 / 1024).toFixed(2) + " MB";
                return (
                  <div key={f.name} className="queue-item">
                    <div className="queue-item-left">
                      <span className="queue-item-name" title={f.name}>{f.name}</span>
                      <div className="queue-item-meta">
                        <span className="queue-item-size">{sizeStr}</span>
                        <span className={`status-badge ${status}`}>{status}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeFile(f.name)}
                      disabled={isLoading && status === "analyzing"}
                      title="Remove file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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
          {Object.keys(results).length > 0 && (
            <div className="tabs-bar">
              {Object.keys(results).map((name) => {
                const isActive = activeTab === name;
                const projName = results[name]?.analysis.projectName || name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`tab-button ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(name)}
                  >
                    <FileText size={14} />
                    <span>{projName}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="results-header">
            <div>
              <p className="eyebrow">Review Desk</p>
              <h2>{activeResult ? activeResult.analysis.documentType : "No document loaded"}</h2>
            </div>
          </div>

          {!activeResult ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <ClipboardList size={34} />
              </div>
              <h2>Your review packet will land here.</h2>
              <p>
                Cairn organizes the contract into milestones, payment terms, subcontractor/GC obligations, and operational risks.
              </p>
            </div>
          ) : (
            <AnalysisView result={activeResult} />
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
            <span className="label">General Contractor / Client</span>
            <span className="value">{analysis.generalContractor}</span>
          </li>
          <li>
            <span className="label">Project Name</span>
            <span className="value">{analysis.projectName}</span>
          </li>
          <li>
            <span className="label">Trade Category</span>
            <span className="value">{analysis.tradeCategory}</span>
          </li>
        </ul>
      </div>

      <div className="grid">
        <div className="section">
          <h2>
            <CalendarClock size={18} aria-hidden="true" />
            Milestones & Deadlines
          </h2>
          {analysis.milestones.length ? (
            <ul className="kv-list">
              {analysis.milestones.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  <span className="label">{item.label}</span>
                  <span className="value">{item.date}</span>
                  <span className="value">{item.actionRequired}</span>
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
            Payment & Financial Terms
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
            Contractual & Scope Risks
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
            Project Obligations
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
            Negotiation Plan
          </h2>
          {analysis.negotiationPlan.length ? (
            <ol className="clean-list">
              {analysis.negotiationPlan.map((item, index) => (
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
            Missing Drawings & Specs
          </h2>
          {analysis.missingSpecs.length ? (
            <ul className="clean-list">
              {analysis.missingSpecs.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <EmptyLine />
          )}
        </div>
      </div>

      <div className="notice">{analysis.disclaimer}</div>
    </div>
  );
}

function EmptyLine() {
  return <p className="empty-line">No items were returned for this section.</p>;
}
