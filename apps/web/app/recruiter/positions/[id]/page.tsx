"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "../../../../lib/api";
import type { Position, PositionStatus } from "../../../../lib/types";

const STATUS_STYLES: Record<Position["status"], string> = {
  OPEN: "bg-[#E6F4EA] text-[#1B6B3A]",
  DRAFT: "bg-[#F1F1EC] text-[#5C5C57]",
  CLOSED: "bg-[#FCE9E7] text-[#A8281E]",
  ARCHIVED: "bg-[#F1F1EC] text-[#8A8A84]",
};

function PositionDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "applicants" | "rounds">("overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Announce email state
  const [announceTo, setAnnounceTo] = useState("");
  const [announceSubject, setAnnounceSubject] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announcing, setAnnouncing] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState(false);
  const [announceError, setAnnounceError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ position: Position }>(`/api/positions/${id}`)
      .then((data) => {
        setPosition(data.position);
        // Pre-fill subject/body from saved template if present
        if (data.position.announcementSubject) setAnnounceSubject(data.position.announcementSubject);
        if (data.position.announcementBody) setAnnounceBody(data.position.announcementBody);
      })
      .catch((err) => {
        setError(err.message || "Failed to load position details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: PositionStatus) => {
    if (!position) return;
    setUpdatingStatus(true);
    try {
      const updated = await apiFetch<{ position: Position }>(
        `/api/positions/${position.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      setPosition(updated.position || { ...position, status: newStatus });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAnnounce = async () => {
    if (!position) return;
    if (!announceTo.trim()) { setAnnounceError("At least one recipient is required."); return; }
    if (!announceSubject.trim()) { setAnnounceError("Subject is required."); return; }
    if (!announceBody.trim()) { setAnnounceError("Body is required."); return; }

    setAnnouncing(true);
    setAnnounceError(null);
    setAnnounceSuccess(false);
    try {
      await apiFetch(`/api/positions/${position.id}/announce`, {
        method: "POST",
        body: JSON.stringify({
          to: announceTo.split(",").map((e) => e.trim()).filter(Boolean),
          subject: announceSubject.trim(),
          body: announceBody.trim(),
        }),
      });
      setAnnounceSuccess(true);
      setTimeout(() => setAnnounceSuccess(false), 4000);
    } catch (err: unknown) {
      setAnnounceError(err instanceof Error ? err.message : "Failed to send announcement");
    } finally {
      setAnnouncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded-md bg-[#E3E3DD]" />
        <div className="h-12 w-80 animate-pulse rounded-xl bg-[#E3E3DD]" />
        <div className="h-64 animate-pulse rounded-[20px] bg-white border border-[#E3E3DD]" />
      </div>
    );
  }

  if (error || !position) {
    return (
      <div className="space-y-6">
        <Link
          href="/recruiter/positions"
          className="inline-flex items-center gap-2 font-mono text-[13px] tracking-[0.04em] text-[#5C5C57] transition-colors hover:text-[#101010]"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to positions
        </Link>
        <div
          role="alert"
          className="rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-6 text-sm text-[#A8281E]"
        >
          <p className="font-semibold text-base">Position not found or unavailable</p>
          <p className="mt-1 text-xs text-[#A8281E]/90">
            {error || "The requested position could not be retrieved from the backend."}
          </p>
        </div>
      </div>
    );
  }

  const applicants = position.applications || [];

  return (
    <div className="space-y-8 font-sans text-[#101010]">
      {/* Top Header */}
      <div>
        <Link
          href="/recruiter/positions"
          className="inline-flex items-center gap-2 font-mono text-[13px] tracking-[0.04em] text-[#5C5C57] transition-colors hover:text-[#101010]"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Positions
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {position.title}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-[13px] font-medium ${STATUS_STYLES[position.status]}`}
            >
              {position.status.charAt(0) + position.status.slice(1).toLowerCase()}
            </span>
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-2">
            {position.status === "DRAFT" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange("OPEN")}
                className="flex min-h-9 cursor-pointer items-center rounded-full bg-[#1B6B3A] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Publish & Open
              </button>
            )}
            {position.status === "OPEN" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange("CLOSED")}
                className="flex min-h-9 cursor-pointer items-center rounded-full border border-[#F2C4BF] bg-[#FCE9E7] px-4 text-[13px] font-medium text-[#A8281E] transition-colors hover:bg-[#F9D6D2] disabled:opacity-50"
              >
                Close position
              </button>
            )}
            {position.status === "CLOSED" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange("OPEN")}
                className="flex min-h-9 cursor-pointer items-center rounded-full border border-[#CFCFC8] px-4 text-[13px] font-medium transition-colors hover:border-[#101010] disabled:opacity-50"
              >
                Reopen position
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 font-mono text-xs text-[#8A8A84]">
          Created on{" "}
          {new Date(position.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E3E3DD] pb-px">
        {[
          { key: "overview", label: "Overview" },
          { key: "applicants", label: `Applicants (${applicants.length})` },
          { key: "rounds", label: "Hiring Pipeline" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`cursor-pointer px-4 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-[#101010] text-[#101010]"
                : "border-transparent text-[#5C5C57] hover:text-[#101010]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-[#101010]">
                About the role
              </h2>
              <div className="mt-3 text-sm leading-relaxed text-[#5C5C57] whitespace-pre-wrap">
                {position.description || (
                  <span className="italic text-[#8A8A84]">
                    No description provided for this position.
                  </span>
                )}
              </div>
            </div>

            {/* Announcement Email */}
            {(position.announcementSubject || position.announcementBody) && (
              <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
                <h2 className="text-base font-semibold text-[#101010]">
                  Announcement Email Template
                </h2>
                {position.announcementSubject && (
                  <div className="mt-3">
                    <p className="font-mono text-xs text-[#8A8A84]">Subject</p>
                    <p className="mt-0.5 text-sm font-medium text-[#101010]">
                      {position.announcementSubject}
                    </p>
                  </div>
                )}
                {position.announcementBody && (
                  <div className="mt-4">
                    <p className="font-mono text-xs text-[#8A8A84]">Body</p>
                    <p className="mt-0.5 text-sm text-[#5C5C57] whitespace-pre-wrap">
                      {position.announcementBody}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Application Form Link Card */}
            <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-[#101010]">Application Form</h3>
              <p className="mt-1 text-xs text-[#5C5C57]">Share this link with candidates to start receiving applications.</p>
              <div className="mt-3 space-y-3">
                <p className="break-all rounded-lg border border-[#E3E3DD] bg-[#F6F6F3] p-2.5 font-mono text-xs text-[#5C5C57]">
                  {typeof window !== "undefined" ? `${window.location.origin}/apply/${position.id}` : `/apply/${position.id}`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/apply/${position.id}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex-1 min-h-9 cursor-pointer rounded-full border border-[#CFCFC8] px-3 text-xs font-medium transition-colors hover:border-[#101010]"
                  >
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  <a
                    href={`/apply/${position.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-9 items-center justify-center rounded-full bg-[#101010] px-4 text-xs font-medium text-[#F6F6F3] hover:opacity-85 transition-opacity"
                  >
                    Preview
                  </a>
                </div>
              </div>
            </div>

            {/* Send Announcement Email */}
            <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#101010]">Send Announcement</h3>
                <p className="mt-0.5 text-xs text-[#5C5C57]">Email candidates about this opening and include your form link.</p>
              </div>

              {announceSuccess && (
                <div className="rounded-xl border border-[#A8DBB5] bg-[#E6F4EA] px-3 py-2 text-xs font-medium text-[#1B6B3A]">
                  ✓ Email sent successfully
                </div>
              )}
              {announceError && (
                <div className="rounded-xl border border-[#F2C4BF] bg-[#FCE9E7] px-3 py-2 text-xs text-[#A8281E]">
                  {announceError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C5C57]">To <span className="text-[#A8281E]">*</span></label>
                <input
                  type="text"
                  value={announceTo}
                  onChange={(e) => setAnnounceTo(e.target.value)}
                  placeholder="candidates@example.com, hr@company.com"
                  className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                />
                <p className="text-[11px] text-[#8A8A84]">Separate multiple addresses with commas</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C5C57]">Subject <span className="text-[#A8281E]">*</span></label>
                <input
                  type="text"
                  value={announceSubject}
                  onChange={(e) => setAnnounceSubject(e.target.value)}
                  placeholder={`We are hiring: ${position.title}`}
                  className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C5C57]">Body <span className="text-[#A8281E]">*</span></label>
                <textarea
                  rows={4}
                  value={announceBody}
                  onChange={(e) => setAnnounceBody(e.target.value)}
                  placeholder={`Hi,\n\nWe are excited to announce an opening for ${position.title}.\n\nApply here: ${typeof window !== "undefined" ? window.location.origin : ""}/apply/${position.id}`}
                  className="w-full rounded-xl border border-[#CFCFC8] bg-white p-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={announcing}
                onClick={handleAnnounce}
                className="w-full min-h-9 cursor-pointer rounded-full bg-[#101010] text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {announcing ? "Sending..." : "Send announcement email"}
              </button>
            </div>

            {/* Application Summary Card */}
            <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-[#101010]">Metrics</h3>
              <div className="mt-4 divide-y divide-[#EDEDE8] text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-[#5C5C57]">Total applicants</span>
                  <span className="font-semibold text-[#101010]">{applicants.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5C5C57]">Active</span>
                  <span className="font-semibold text-[#1B6B3A]">
                    {applicants.filter((a) => a.status === "ACTIVE").length}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#5C5C57]">Hired</span>
                  <span className="font-semibold text-[#2F4BFF]">
                    {applicants.filter((a) => a.status === "HIRED").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Applicants */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          {applicants.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#CFCFC8] bg-white px-6 py-16 text-center">
              <p className="text-base font-medium">No applicants yet</p>
              <p className="mt-1 text-sm text-[#5C5C57]">
                Share the application form link with candidates to start receiving responses.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-[#E3E3DD] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#EDEDE8] bg-[#FAFAF8] font-mono text-xs text-[#8A8A84]">
                    <tr>
                      <th className="px-5 py-3 font-normal">Candidate</th>
                      <th className="px-5 py-3 font-normal">Status</th>
                      <th className="px-5 py-3 font-normal">AI Score</th>
                      <th className="px-5 py-3 font-normal">Applied</th>
                      <th className="px-5 py-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F3EF]">
                    {applicants.map((app) => (
                      <tr key={app.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#101010]">
                            {app.candidate?.name || "Unknown"}
                          </p>
                          <p className="font-mono text-xs text-[#8A8A84]">
                            {app.candidate?.email || "No email"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block rounded-full bg-[#E6F4EA] px-2.5 py-0.5 text-xs font-medium text-[#1B6B3A]">
                            {app.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {app.aiScore ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#2F4BFF]">
                              {app.aiScore} / 100
                            </span>
                          ) : (
                            <span className="text-xs text-[#8A8A84]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-[#5C5C57]">
                          {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/recruiter/candidates/${app.candidateId}`}
                            className="inline-flex min-h-8 items-center rounded-full border border-[#CFCFC8] px-3 text-xs font-medium transition-colors hover:border-[#101010]"
                          >
                            View candidate
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Hiring Pipeline */}
      {activeTab === "rounds" && (
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-[#101010]">
              Evaluation Pipeline
            </h2>
            <p className="mt-1 text-sm text-[#5C5C57]">
              Ordered stages for screening, testing, assessment, and interview for this position.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { order: 1, title: "1. Google Form Screening", type: "FORM", desc: "Responses collected from candidates via linked form." },
                { order: 2, title: "2. Resume Review & AI Ranking", type: "MANUAL", desc: "Advisory scoring and recruiter selection." },
                { order: 3, title: "3. Physical Quiz / Test", type: "TEST", desc: "In-person test marks recorded and published." },
                { order: 4, title: "4. Practical Assessment", type: "ASSESSMENT", desc: "Candidate submits GitHub repository and demo link." },
                { order: 5, title: "5. Interview", type: "INTERVIEW", desc: "Google Meet link and scheduled date/time." },
                { order: 6, title: "6. Final Decision", type: "MANUAL", desc: "Publish Selected or Rejected decision to candidate portal." },
              ].map((step) => (
                <div
                  key={step.order}
                  className="flex items-start gap-4 rounded-xl border border-[#EDEDE8] p-4 bg-[#FAFAF8]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101010] text-xs font-semibold text-white">
                    {step.order}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[#101010]">{step.title}</p>
                      <span className="font-mono text-[11px] text-[#8A8A84] rounded-sm bg-[#E3E3DD] px-1.5 py-0.2">
                        {step.type}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#5C5C57]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PositionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-6 w-32 animate-pulse rounded-md bg-[#E3E3DD]" />
          <div className="h-12 w-80 animate-pulse rounded-xl bg-[#E3E3DD]" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white border border-[#E3E3DD]" />
        </div>
      }
    >
      <PositionDetailContent />
    </Suspense>
  );
}
