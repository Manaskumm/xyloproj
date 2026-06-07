"use client";

import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  FileCheck2,
  FileText,
  ShieldCheck,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Copy,
  Check,
  User,
  Building,
  Activity
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { EmailAnalysis } from "@/features/lease-review/types";
import sampleEmailsData from "../sample-emails.json";

type AnalyzeResponse = {
  analysis: EmailAnalysis;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  promptVersion: string;
};

interface EmailItem {
  fileName: string;
  content: string;
  subject?: string;
  sender?: string;
}

export function LeaseReviewClient() {
  // Inbox state (14 sample emails + custom uploads)
  const [inbox, setInbox] = useState<EmailItem[]>(() => {
    return sampleEmailsData.map((email) => {
      // Extract basic headers for display in list
      const lines = email.content.split("\n");
      const fromLine = lines.find(l => l.toLowerCase().startsWith("from:"));
      const subLine = lines.find(l => l.toLowerCase().startsWith("subject:"));
      
      const sender = fromLine ? fromLine.replace(/^from:\s*/i, "").trim() : "Unknown Sender";
      const subject = subLine ? subLine.replace(/^subject:\s*/i, "").trim() : "(No Subject)";
      
      return {
        fileName: email.fileName,
        content: email.content,
        sender,
        subject: subject || "(No Subject)"
      };
    });
  });

  const [results, setResults] = useState<Record<string, AnalyzeResponse>>({});
  const [fileStatuses, setFileStatuses] = useState<Record<string, "ready" | "analyzing" | "completed" | "failed">>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  
  // Track check state for action items per file/email
  const [checkedActions, setCheckedActions] = useState<Record<string, Record<number, boolean>>>({});

  // Helper to extract email info for display
  const activeEmailItem = useMemo(() => {
    return inbox.find((item) => item.fileName === activeTab) || null;
  }, [activeTab, inbox]);

  const activeResult = useMemo(() => {
    return activeTab ? results[activeTab] : null;
  }, [activeTab, results]);

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

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const fromLine = lines.find(l => l.toLowerCase().startsWith("from:"));
        const subLine = lines.find(l => l.toLowerCase().startsWith("subject:"));
        
        const sender = fromLine ? fromLine.replace(/^from:\s*/i, "").trim() : "Uploaded File";
        const subject = subLine ? subLine.replace(/^subject:\s*/i, "").trim() : file.name;

        setInbox((prev) => {
          if (prev.some((item) => item.fileName === file.name)) {
            return prev; // Avoid duplicate filenames
          }
          return [
            ...prev,
            {
              fileName: file.name,
              content: text,
              sender,
              subject
            }
          ];
        });

        setFileStatuses((prev) => ({
          ...prev,
          [file.name]: "ready"
        }));
      };
      reader.readAsText(file);
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

  const removeFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInbox((prev) => prev.filter((f) => f.fileName !== fileName));
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
        const remaining = inbox.filter((item) => item.fileName !== fileName);
        return remaining.length > 0 ? remaining[0].fileName : null;
      }
      return prev;
    });
  };

  const runTriage = async (email: EmailItem) => {
    const fileName = email.fileName;
    if (fileStatuses[fileName] === "analyzing" || fileStatuses[fileName] === "completed") {
      setActiveTab(fileName);
      return;
    }

    setIsLoading(true);
    setError("");
    setActiveTab(fileName);
    setFileStatuses((prev) => ({ ...prev, [fileName]: "analyzing" }));

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: email.content,
          fileName
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Triage failed.");
      }

      setResults((prev) => ({ ...prev, [fileName]: payload }));
      setFileStatuses((prev) => ({ ...prev, [fileName]: "completed" }));
    } catch (caught) {
      setFileStatuses((prev) => ({ ...prev, [fileName]: "failed" }));
      setError(
        `Failed to triage ${fileName}: ${
          caught instanceof Error ? caught.message : "unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, fileName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [fileName]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [fileName]: false }));
    }, 2000);
  };

  const toggleActionItem = (fileName: string, index: number) => {
    setCheckedActions((prev) => {
      const fileMap = prev[fileName] || {};
      const updated = {
        ...prev,
        [fileName]: {
          ...fileMap,
          [index]: !fileMap[index]
        }
      };
      return updated;
    });
  };

  return (
    <main className="app-shell" id="main-content">
      <a className="skip-link" href="#triage-packet">
        Skip to Triage Desk
      </a>
      <div className="workspace">
        <aside className="sidebar">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true">
              <Mail size={18} strokeWidth={2.3} />
            </span>
            <p className="eyebrow" translate="no">
              LedgerSync
            </p>
          </div>
          <h1>AI Triage & Reconciliation</h1>
          <p className="lead">
            Automate inbox triage and reconcile incoming client disputes, documentation updates, and tax queries directly against CRM notes.
          </p>

          <div style={{ marginBottom: "20px" }}>
            <label 
              className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{ padding: "24px 16px" }}
            >
              {isLoading && <div className="scanning-beam" />}
              <span className="upload-icon" aria-hidden="true" style={{ height: "42px", width: "42px" }}>
                <UploadCloud size={20} />
              </span>
              <strong style={{ fontSize: "12px" }}>Drop Emails or Upload txt</strong>
              <span className="file-trigger" style={{ minWidth: "90px", fontSize: "10px", padding: "6px 12px" }}>Browse Files</span>
              <input
                className="file-input"
                name="email-documents"
                type="file"
                multiple
                accept=".txt,text/plain"
                onChange={(event) => {
                  addFiles(event.target.files);
                }}
              />
            </label>
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className="file-queue" style={{ borderTop: "1px solid var(--line)" }}>
            <h3 className="queue-title">Triage Inbox Queue ({inbox.length})</h3>
            <div className="inbox-list">
              {inbox.map((email) => {
                const status = fileStatuses[email.fileName] || "ready";
                const isActive = activeTab === email.fileName;
                return (
                  <button
                    key={email.fileName}
                    type="button"
                    className={`inbox-item ${isActive ? "active" : ""}`}
                    onClick={() => runTriage(email)}
                    disabled={isLoading && status === "analyzing"}
                  >
                    <div className="inbox-item-header">
                      <span className="inbox-item-sender" title={email.sender}>
                        {email.sender}
                      </span>
                      <div className="queue-item-meta">
                        <span className={`status-badge ${status}`}>{status}</span>
                        {email.fileName.startsWith("email_") ? null : (
                          <span
                            onClick={(e) => removeFile(email.fileName, e)}
                            style={{ color: "var(--color-ash)", cursor: "pointer", marginLeft: "4px" }}
                            title="Delete file"
                          >
                            <Trash2 size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inbox-item-subject" title={email.subject}>
                      {email.subject}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="meta-list" aria-label="Workflow notes">
            <div className="meta-item">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Runs in-memory with Groq Llama-3.3 validation schema.</span>
            </div>
            <div className="meta-item">
              <ClipboardList size={18} aria-hidden="true" />
              <span>Matches emails directly with parsed crm_export.csv.</span>
            </div>
          </div>
        </aside>

        <section className="results" id="triage-packet" aria-live="polite">
          <div className="results-header">
            <div>
              <p className="eyebrow">Triage Desk</p>
              <h2>{activeEmailItem ? activeEmailItem.subject : "No Email Selected"}</h2>
            </div>
            {activeResult && (
              <div style={{ display: "flex", gap: "8px" }}>
                <span className={`badge-intent ${activeResult.analysis.intent}`}>
                  {activeResult.analysis.intent.replace(/_/g, " ")}
                </span>
                <span className={`badge-priority ${activeResult.analysis.priority}`}>
                  {activeResult.analysis.priority} priority
                </span>
              </div>
            )}
          </div>

          {!activeResult ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <ClipboardList size={34} />
              </div>
              <h2>Select an email to run triage</h2>
              <p>
                LedgerSync analyzes client email intents, highlights discrepancies with CRM values, creates a tasks list, and drafts auto-replies.
              </p>
            </div>
          ) : (
            <div className="results-body">
              {/* Split layout for Email view vs Analysis */}
              <div className="grid">
                {/* Left card: Original Email */}
                <div className="section">
                  <h2>
                    <Mail size={18} aria-hidden="true" />
                    Original Message
                  </h2>
                  <div 
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--line)",
                      padding: "16px",
                      fontSize: "14px",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      color: "var(--color-smoke)",
                      maxHeight: "300px",
                      overflowY: "auto"
                    }}
                  >
                    {activeEmailItem?.content}
                  </div>
                </div>

                {/* Right card: Executive Summary */}
                <div className="section">
                  <h2>
                    <FileCheck2 size={18} aria-hidden="true" />
                    Executive Summary
                  </h2>
                  <p className="value" style={{ fontSize: "15px", lineHeight: "1.6" }}>
                    {activeResult.analysis.executiveSummary}
                  </p>
                  
                  <div style={{ marginTop: "20px" }}>
                    <h3 style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--color-ash)", letterSpacing: "0.05em" }}>Sender Info</h3>
                    <ul className="kv-list" style={{ marginTop: "8px" }}>
                      <li>
                        <span className="label">Name / Sender</span>
                        <span className="value">{activeResult.analysis.senderName} ({activeResult.analysis.senderEmail})</span>
                      </li>
                      {activeResult.analysis.company && (
                        <li>
                          <span className="label">Company</span>
                          <span className="value">{activeResult.analysis.company}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* CRM Reconciliation & Discrepancies */}
              <div className="section full">
                <h2>
                  <Activity size={18} aria-hidden="true" />
                  CRM Verification & Reconciliation
                </h2>
                
                {activeResult.analysis.crmMatch.discrepancyFound ? (
                  <div className="discrepancy-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <AlertTriangle size={20} className="text-red-500" style={{ color: "#ef4444" }} />
                      <h3 style={{ margin: 0, color: "#ef4444", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Discrepancy Warning Flagged
                      </h3>
                    </div>
                    <p style={{ color: "var(--color-paper-white)", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
                      {activeResult.analysis.crmMatch.discrepancyDetails}
                    </p>
                  </div>
                ) : (
                  <div className="discrepancy-card warning" style={{ borderColor: "var(--ok)", background: "rgba(22, 163, 74, 0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <CheckCircle2 size={20} style={{ color: "var(--ok)" }} />
                      <h3 style={{ margin: 0, color: "var(--ok)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        CRM Status Reconciled
                      </h3>
                    </div>
                    <p style={{ color: "var(--color-smoke)", fontSize: "14px", margin: 0 }}>
                      No billing mismatches or processing conflicts flagged between the email query and CRM notes.
                    </p>
                  </div>
                )}

                <div className="grid" style={{ gap: "16px", marginTop: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--color-ash)", letterSpacing: "0.05em" }}>CRM Profile</h3>
                    <ul className="kv-list" style={{ marginTop: "8px" }}>
                      <li>
                        <span className="label">Matched Record Name</span>
                        <span className="value">{activeResult.analysis.crmMatch.matchedName || "Unmatched / New Lead"}</span>
                      </li>
                      <li>
                        <span className="label">CRM Client ID</span>
                        <span className="value">{activeResult.analysis.crmMatch.clientId || "N/A"}</span>
                      </li>
                      <li>
                        <span className="label">Contract Status</span>
                        <span className="value" style={{ textTransform: "capitalize" }}>
                          {activeResult.analysis.crmMatch.status || "N/A"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--color-ash)", letterSpacing: "0.05em" }}>Financial Profile</h3>
                    <ul className="kv-list" style={{ marginTop: "8px" }}>
                      <li>
                        <span className="label">Expected Value / Monthly Fee</span>
                        <span className="value">
                          {activeResult.analysis.crmMatch.crmValue ? `$${activeResult.analysis.crmMatch.crmValue}` : "N/A"}
                        </span>
                      </li>
                      <li>
                        <span className="label">CRM Notes / Flags</span>
                        <span className="value" style={{ fontStyle: "italic" }}>
                          {activeResult.analysis.crmMatch.matchedName ? "Refer to discrepancy summary details" : "Record not found in CRM. Intake pipeline suggested."}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action items & Draft Auto-reply split */}
              <div className="grid">
                <div className="section">
                  <h2>
                    <ClipboardList size={18} aria-hidden="true" />
                    Recommended Actions
                  </h2>
                  <div className="action-checkbox-list">
                    {activeResult.analysis.actionItems.map((item, index) => {
                      const isChecked = checkedActions[activeTab!]?.[index] || false;
                      return (
                        <label
                          key={index}
                          className={`action-checkbox-item ${isChecked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleActionItem(activeTab!, index)}
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ margin: 0, display: "flex", gap: "10px", alignItems: "center" }}>
                      <FileText size={18} aria-hidden="true" />
                      Draft Reply
                    </h2>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleCopyText(activeResult.analysis.draftReply, activeTab!)}
                      style={{ width: "auto", minHeight: "30px", padding: "4px 12px", fontSize: "10px" }}
                    >
                      {copiedMap[activeTab!] ? (
                        <>
                          <Check size={12} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy Draft
                        </>
                      )}
                    </button>
                  </div>
                  <div className="draft-container">
                    <textarea
                      className="draft-textarea"
                      value={activeResult.analysis.draftReply}
                      readOnly
                      title="Edit response draft"
                    />
                  </div>
                </div>
              </div>

              <div className="notice">{activeResult.analysis.disclaimer}</div>

              {/* Triage metadata */}
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-ash)", fontSize: "11px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                <span>Model: {activeResult.model}</span>
                <span>Tokens: {activeResult.usage.totalTokens} (In: {activeResult.usage.inputTokens} | Out: {activeResult.usage.outputTokens})</span>
                <span>Prompt Version: {activeResult.promptVersion}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
