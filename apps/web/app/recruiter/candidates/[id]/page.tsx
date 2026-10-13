"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { API_BASE_URL } from "../../../../lib/api";
import { getCandidateById } from "../../../../lib/candidates";
import type { Candidate, ApplicationStatus } from "../../../../lib/types";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  ACTIVE: "bg-[#E6F4EA] text-[#1B6B3A]",
  HIRED: "bg-[#E6F0FF] text-[#2F4BFF]",
  REJECTED: "bg-[#FCE9E7] text-[#A8281E]",
  WITHDRAWN: "bg-[#F1F1EC] text-[#8A8A84]",
};

function CandidateDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const from = searchParams?.get("from");

  const backHref = from || "/recruiter/candidates";
  const backLabel =
    from && from.includes("/recruiter/positions")
      ? "Back to position"
      : from
        ? "Back"
        : "Candidates";

  const handleBack = (e: React.MouseEvent) => {
    if (!from && typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCandidateById(id)
      .then((data) => {
        setCandidate(data.candidate);
      })
      .catch((err) => {
        setError(err.message || "Failed to load candidate");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded-md bg-[#E3E3DD]" />
        <div className="h-16 w-80 animate-pulse rounded-xl bg-[#E3E3DD]" />
        <div className="h-64 animate-pulse rounded-[20px] bg-white border border-[#E3E3DD]" />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-6">
        <Link
          href={backHref}
          onClick={handleBack}
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
          {backLabel === "Candidates" ? "Back to candidates" : backLabel}
        </Link>
        <div
          role="alert"
          className="rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-6 text-sm text-[#A8281E]"
        >
          <p className="font-semibold text-base">
            Candidate not found or unavailable
          </p>
          <p className="mt-1 text-xs text-[#A8281E]/90">
            {error ||
              "The requested candidate could not be retrieved from the backend."}
          </p>
        </div>
      </div>
    );
  }

  const applications = candidate.applications || [];

  return (
    <div className="space-y-8 font-sans text-[#101010]">
      {/* Top Header */}
      <div>
        <Link
          href={backHref}
          onClick={handleBack}
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
          {backLabel}
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#101010] text-xl font-bold text-[#F6F6F3]">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {candidate.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-[#5C5C57]">
                <span>{candidate.email}</span>
                {candidate.phone && (
                  <>
                    <span>•</span>
                    <span>{candidate.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">
          Applications ({applications.length})
        </h2>

        {applications.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#CFCFC8] bg-white p-12 text-center text-sm text-[#5C5C57]">
            No recorded applications found for this candidate.
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="space-y-6 rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs sm:p-8"
            >
              {/* Application Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEDE8] pb-5">
                <div>
                  <p className="font-mono text-xs text-[#8A8A84]">Position</p>
                  <h3 className="mt-0.5 text-lg font-semibold text-[#101010]">
                    {app.position?.title || "Job Application"}
                  </h3>
                  <p className="mt-1 text-xs text-[#5C5C57]">
                    Applied on{" "}
                    {new Date(
                      app.appliedAt || app.createdAt,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_STYLES[app.status] || "bg-[#F1F1EC] text-[#5C5C57]"
                    }`}
                  >
                    {app.status}
                  </span>
                  {app.resumeUrl && (
                    <a
                      href={
                        app.resumeUrl.startsWith("http")
                          ? app.resumeUrl
                          : `${API_BASE_URL}${app.resumeUrl.startsWith("/") ? "" : "/"}${app.resumeUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#101010] px-4 text-xs font-medium text-white transition-opacity hover:opacity-85"
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
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      View Resume
                    </a>
                  )}
                </div>
              </div>

              {/* AI Score / Evaluation card if available */}
              {app.aiScore !== null && app.aiScore !== undefined && (
                <div className="rounded-xl border border-[#D0DAFF] bg-[#F5F7FF] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-medium uppercase tracking-wider text-[#2F4BFF]">
                        AI Resume Evaluation
                      </p>
                      <p className="mt-1 text-xs text-[#5C5C57]">
                        Advisory assessment based on role requirements.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-2xl font-bold text-[#2F4BFF]">
                        {app.aiScore}
                      </span>
                      <span className="text-xs text-[#8A8A84]"> / 100</span>
                    </div>
                  </div>

                  {app.aiEvaluation && (
                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#D0DAFF] pt-4 sm:grid-cols-2 text-xs">
                      {app.aiEvaluation.strengths &&
                        app.aiEvaluation.strengths.length > 0 && (
                          <div>
                            <p className="font-semibold text-[#1B6B3A]">
                              Key Strengths
                            </p>
                            <ul className="mt-1 list-disc list-inside space-y-1 text-[#5C5C57]">
                              {app.aiEvaluation.strengths.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {app.aiEvaluation.gaps &&
                        app.aiEvaluation.gaps.length > 0 && (
                          <div>
                            <p className="font-semibold text-[#A8281E]">
                              Identified Gaps
                            </p>
                            <ul className="mt-1 list-disc list-inside space-y-1 text-[#5C5C57]">
                              {app.aiEvaluation.gaps.map((g, idx) => (
                                <li key={idx}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* Candidate Answers (from Form) */}
              {app.rawAnswers && typeof app.rawAnswers === "object" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#101010]">
                    Form Responses
                  </h4>
                  <div className="divide-y divide-[#F3F3EF] rounded-xl border border-[#EDEDE8] bg-[#FAFAF8] text-xs">
                    {Object.entries(app.rawAnswers).map(
                      ([question, answer], idx) => (
                        <div key={idx} className="p-3.5">
                          <p className="font-mono text-[11px] text-[#8A8A84]">
                            {question}
                          </p>
                          <p className="mt-1 text-sm text-[#101010]">
                            {typeof answer === "string"
                              ? answer
                              : JSON.stringify(answer)}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Round Participations if available */}
              {app.roundResults && app.roundResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#101010]">
                    Hiring Round Results
                  </h4>
                  <div className="space-y-2">
                    {app.roundResults.map((round) => (
                      <div
                        key={round.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EDEDE8] p-3 text-xs"
                      >
                        <div>
                          <p className="font-medium text-[#101010]">
                            {round.round?.title || "Round"}
                          </p>
                          <p className="font-mono text-[11px] text-[#8A8A84]">
                            Status: {round.status}
                          </p>
                        </div>
                        {round.score !== null && round.score !== undefined && (
                          <div className="font-mono font-semibold text-[#101010]">
                            Score: {round.score}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-6 w-32 animate-pulse rounded-md bg-[#E3E3DD]" />
          <div className="h-16 w-80 animate-pulse rounded-xl bg-[#E3E3DD]" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white border border-[#E3E3DD]" />
        </div>
      }
    >
      <CandidateDetailContent />
    </Suspense>
  );
}
