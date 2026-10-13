"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

import {
  getTrackingApplication,
  submitAssessmentLinks,
  type TrackingApplication,
  type TrackingRound,
  type TrackingRoundResult,
} from "../../../lib/tracking";

function TrackingPortalContent() {
  const params = useParams();
  const token = params?.token as string;

  const [application, setApplication] = useState<TrackingApplication | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Assessment submission state keyed by roundId
  const [assessmentGithub, setAssessmentGithub] = useState<Record<string, string>>({});
  const [assessmentOther, setAssessmentOther] = useState<Record<string, string>>({});
  const [assessmentSubmitting, setAssessmentSubmitting] = useState<Record<string, boolean>>({});
  const [assessmentSuccess, setAssessmentSuccess] = useState<Record<string, boolean>>({});
  const [assessmentError, setAssessmentError] = useState<Record<string, string | null>>({});

  const handleAssessmentSubmit = async (roundId: string) => {
    if (!token) return;
    setAssessmentSubmitting((prev) => ({ ...prev, [roundId]: true }));
    setAssessmentError((prev) => ({ ...prev, [roundId]: null }));
    try {
      const data = await submitAssessmentLinks(token, roundId, {
        githubUrl: assessmentGithub[roundId]?.trim() || null,
        otherUrl: assessmentOther[roundId]?.trim() || null,
      });

      // Update local round result submissionData
      setApplication((prev) => {
        if (!prev) return prev;
        const submissionData = data.participation?.submissionData || {
          githubUrl: assessmentGithub[roundId]?.trim() || null,
          otherUrl: assessmentOther[roundId]?.trim() || null,
          submittedAt: new Date().toISOString(),
        };
        const exists = prev.roundResults.find((r) => r.roundId === roundId);
        const updatedResults = exists
          ? prev.roundResults.map((r) =>
              r.roundId === roundId ? { ...r, submissionData, status: "IN_PROGRESS" as const } : r,
            )
          : [
              ...prev.roundResults,
              {
                id: data.participation?.id || roundId,
                roundId,
                status: "IN_PROGRESS" as const,
                score: null,
                isPublished: false,
                submissionData,
              },
            ];
        return { ...prev, roundResults: updatedResults };
      });
      setAssessmentSuccess((prev) => ({ ...prev, [roundId]: true }));
    } catch (err: unknown) {
      setAssessmentError((prev) => ({
        ...prev,
        [roundId]: err instanceof Error ? err.message : "Submission failed. Please try again.",
      }));
    } finally {
      setAssessmentSubmitting((prev) => ({ ...prev, [roundId]: false }));
    }
  };

  useEffect(() => {
    if (!token) return;

    getTrackingApplication(token)
      .then((data) => {
        setApplication(data.application);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Unable to load application.",
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  const copyPageUrl = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3]">
        <div className="flex items-center gap-3 text-sm text-[#5C5C57]">
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading application portal...
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3] p-6">
        <div className="max-w-md w-full rounded-[24px] border border-[#F2C4BF] bg-[#FCE9E7] p-8 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FADBD8]">
            <svg
              className="h-6 w-6 text-[#A8281E]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#A8281E]">
              Application Not Found
            </h2>
            <p className="mt-2 text-sm text-[#A8281E]/80">
              {error ||
                "The tracking link you used is invalid or expired. Please check your link and try again."}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#101010] px-5 text-xs font-medium text-white transition-opacity hover:opacity-85"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { candidate, position, roundResults, status, appliedAt } = application;
  const isRejected =
    status === "REJECTED" || roundResults.some((r) => r.status === "FAILED");
  const isHired = status === "HIRED";

  // Compute status for each round
  const rounds = position.rounds || [];
  let foundActiveRound = false;

  const roundStatuses = rounds.map((round) => {
    const result = roundResults.find((r) => r.roundId === round.id);

    if (isHired) {
      return { round, result, stageState: "PASSED" as const };
    }

    if (result?.status === "PASSED") {
      return { round, result, stageState: "PASSED" as const };
    }

    if (
      result?.status === "FAILED" ||
      (isRejected &&
        !foundActiveRound &&
        (result?.status === "PENDING" || !result))
    ) {
      foundActiveRound = true;
      return { round, result, stageState: "FAILED" as const };
    }

    if (!isRejected && !foundActiveRound) {
      // First round not yet passed is the CURRENT active round under evaluation
      foundActiveRound = true;
      return { round, result, stageState: "CURRENT" as const };
    }

    return { round, result, stageState: "UPCOMING" as const };
  });

  const currentRound = roundStatuses.find(
    (r) => r.stageState === "CURRENT",
  )?.round;

  return (
    <div className="min-h-screen bg-[#F6F6F3] py-12 px-4 font-sans text-[#101010]">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Top Header Card */}
        <div className="rounded-[24px] border border-[#E3E3DD] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#8A8A84]">
                  Candidate Tracking Portal
                </span>
                <span className="rounded-full bg-[#F1F1EC] px-2 py-0.5 font-mono text-[11px] text-[#5C5C57]">
                  Confidential
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl text-[#101010]">
                {position.title}
              </h1>
              <p className="mt-1 text-sm text-[#5C5C57]">
                Applicant:{" "}
                <strong className="text-[#101010]">{candidate.name}</strong> (
                {candidate.email})
              </p>
            </div>

            <button
              type="button"
              onClick={copyPageUrl}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#CFCFC8] px-4 text-xs font-medium transition-colors hover:border-[#101010]"
            >
              <svg
                className="h-3.5 w-3.5 text-[#5C5C57]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? "Link Copied!" : "Share / Bookmark Link"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-[#EDEDE8] pt-4 text-xs text-[#5C5C57]">
            <div>
              <span className="text-[#8A8A84]">Applied on:</span>{" "}
              <strong className="text-[#101010]">
                {new Date(appliedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
            </div>
            <div>
              <span className="text-[#8A8A84]">Total Evaluation Stages:</span>{" "}
              <strong className="text-[#101010]">{rounds.length}</strong>
            </div>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isHired && (
          <div className="rounded-[20px] border border-[#A8DBB5] bg-[#E6F4EA] p-6 text-[#1B6B3A] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B6B3A] text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Congratulations! You have been selected!
                </h3>
                <p className="mt-1 text-sm text-[#1B6B3A]/90 leading-relaxed">
                  You have successfully completed all evaluation rounds for{" "}
                  <strong>{position.title}</strong>. Our talent team has
                  extended a selection decision and will contact you via email
                  regarding formal offer details.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="rounded-[20px] border border-[#F2C4BF] bg-[#FCE9E7] p-6 text-[#A8281E] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A8281E] text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Application Status: Not Selected
                </h3>
                <p className="mt-1 text-sm text-[#A8281E]/90 leading-relaxed">
                  Thank you for your interest in{" "}
                  <strong>{position.title}</strong> and for taking part in our
                  recruitment process. After careful review, we regret to inform
                  you that your application will not be advancing further at
                  this time.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isHired && !isRejected && (
          <div className="rounded-[20px] border border-[#C5D1FA] bg-[#EEF2FF] p-6 text-[#2F4BFF] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2F4BFF] text-white">
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Application In Active Review
                </h3>
                <p className="mt-1 text-sm text-[#2F4BFF]/90 leading-relaxed">
                  Your application is currently being evaluated.
                  {currentRound ? (
                    <>
                      {" "}
                      Current stage: <strong>{currentRound.title}</strong>.
                      Check the stage timeline below for upcoming schedules and
                      instructions.
                    </>
                  ) : (
                    " We will notify you as soon as the next stage instructions are published."
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Pipeline Timeline */}
        <div className="rounded-[24px] border border-[#E3E3DD] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#101010]">
              Evaluation Pipeline
            </h2>
            <p className="mt-1 text-xs text-[#5C5C57]">
              Step-by-step progression adapted for this position. Stages update
              automatically as results and schedules are published.
            </p>
          </div>

          <div className="relative pl-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E3E3DD] space-y-6">
            {roundStatuses.map(({ round, result, stageState }, index) => {
              const isPassed = stageState === "PASSED";
              const isCurrent = stageState === "CURRENT";
              const isFailed = stageState === "FAILED";

              return (
                <div key={round.id} className="relative">
                  {/* Step marker icon */}
                  <span
                    className={`absolute -left-6 top-1 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      isPassed
                        ? "border-[#1B6B3A] bg-[#E6F4EA] text-[#1B6B3A]"
                        : isFailed
                          ? "border-[#A8281E] bg-[#FCE9E7] text-[#A8281E]"
                          : isCurrent
                            ? "border-[#2F4BFF] bg-[#2F4BFF] text-white shadow-xs"
                            : "border-[#CFCFC8] bg-white text-[#8A8A84]"
                    }`}
                  >
                    {isPassed ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : isFailed ? (
                      "✗"
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Stage Card */}
                  <div
                    className={`rounded-2xl border p-5 transition-all ${
                      isCurrent
                        ? "border-[#2F4BFF] bg-[#FAFAF8] shadow-xs"
                        : isPassed
                          ? "border-[#E3E3DD] bg-white"
                          : isFailed
                            ? "border-[#F2C4BF] bg-[#FCE9E7]/40"
                            : "border-[#EDEDE8] bg-[#FAFAF8]/60 text-[#8A8A84]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-[#101010]">
                          {round.title}
                        </h3>
                        <span className="font-mono text-[11px] rounded bg-[#EDEDE8] px-2 py-0.5 text-[#5C5C57]">
                          {round.type}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isPassed && (
                          <span className="rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-medium text-[#1B6B3A]">
                            ✓ Cleared
                          </span>
                        )}
                        {isFailed && (
                          <span className="rounded-full bg-[#FCE9E7] px-3 py-1 text-xs font-medium text-[#A8281E]">
                            Not Cleared
                          </span>
                        )}
                        {isCurrent && (
                          <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-medium text-[#2F4BFF]">
                            In Progress
                          </span>
                        )}
                        {!isPassed && !isFailed && !isCurrent && (
                          <span className="rounded-full bg-[#F1F1EC] px-3 py-1 text-xs font-medium text-[#8A8A84]">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    {round.instructions && (
                      <p className="mt-2 text-xs leading-relaxed text-[#5C5C57]">
                        {round.instructions}
                      </p>
                    )}

                    {/* Interview details if scheduled and published for this candidate */}
                    {(() => {
                      const isCandidatePublished = Boolean(result?.isPublished);
                      const interviewDate = result?.scheduledAt || (isCandidatePublished ? round.config?.meetingDate : null);
                      const interviewUrl = result?.meetingUrl || (isCandidatePublished ? round.config?.meetingUrl : null);

                      if (isCandidatePublished && (interviewDate || interviewUrl)) {
                        return (
                          <div className="mt-4 rounded-xl border border-[#C5D1FA] bg-[#EEF2FF] p-4 text-xs text-[#2F4BFF] space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2F4BFF]/15 pb-2">
                              <span className="font-semibold text-sm text-[#101010] flex items-center gap-1.5">
                                🎥 Final Interview Schedule
                              </span>
                              <span className="rounded-full bg-[#E6F4EA] border border-[#A8DBB5] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B6B3A]">
                                ✓ Confirmed
                              </span>
                            </div>

                            {interviewDate && (
                              <div className="flex items-center gap-2 font-medium text-[#101010]">
                                <svg
                                  className="h-4 w-4 text-[#2F4BFF]"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>
                                  Date & Time:{" "}
                                  <strong>
                                    {new Date(interviewDate).toLocaleString(
                                      "en-US",
                                      {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </strong>
                                  {result?.timeZone && ` (${result.timeZone})`}
                                </span>
                              </div>
                            )}

                            {interviewUrl && (
                              <div>
                                <a
                                  href={interviewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#2F4BFF] px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-xs"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                    />
                                  </svg>
                                  Join Google Meet →
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (isCurrent && round.type === "INTERVIEW") {
                        return (
                          <div className="mt-3 rounded-xl border border-dashed border-[#CFCFC8] bg-white/70 p-3.5 text-xs text-[#5C5C57]">
                            ⏳ The interview date and Google Meet link will be scheduled and published here by the hiring team shortly.
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Written Test Details if published for this candidate */}
                    {Boolean(result?.isPublished) &&
                      round.config &&
                      (round.config.testDate ||
                        round.config.location ||
                        round.config.mapUrl ||
                        round.config.syllabus) && (
                        <div className="mt-4 rounded-xl border border-[#2F4BFF]/30 bg-[#EEF2FF]/60 p-4 text-xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2F4BFF]/15 pb-2">
                            <span className="font-semibold text-sm text-[#101010] flex items-center gap-1.5">
                              📝 Written Test & Venue Details
                            </span>
                            <span className="rounded-full bg-[#E6F4EA] border border-[#A8DBB5] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B6B3A]">
                              ✓ Official Schedule
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#101010]">
                            {round.config.testDate && (
                              <div className="space-y-0.5">
                                <span className="font-mono text-[11px] text-[#5C5C57] block">
                                  📅 Date & Time
                                </span>
                                <p className="font-semibold text-sm text-[#101010]">
                                  {new Date(round.config.testDate).toLocaleString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                            )}

                            {round.config.location && (
                              <div className="space-y-0.5">
                                <span className="font-mono text-[11px] text-[#5C5C57] block">
                                  📍 Physical Venue
                                </span>
                                <p className="font-semibold text-sm text-[#101010]">
                                  {round.config.location}
                                </p>
                              </div>
                            )}
                          </div>

                          {round.config.mapUrl && (
                            <div className="pt-0.5">
                              <a
                                href={round.config.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#2F4BFF] px-4 text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-xs"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                  />
                                </svg>
                                Open in Google Maps ↗
                              </a>
                            </div>
                          )}

                          {round.config.syllabus && (
                            <div className="mt-2 rounded-lg border border-[#E3E3DD] bg-white p-3 space-y-1">
                              <span className="font-mono text-[11px] font-semibold text-[#5C5C57] uppercase tracking-wider block">
                                Syllabus & Test Guidelines
                              </span>
                              <p className="text-xs text-[#101010] whitespace-pre-wrap leading-relaxed">
                                {round.config.syllabus}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Notice if round is TEST and in-progress, but details are not published yet for this candidate */}
                    {isCurrent &&
                      round.type === "TEST" &&
                      (!result?.isPublished ||
                        !round.config ||
                        (!round.config.testDate && !round.config.location)) && (
                        <div className="mt-3 rounded-xl border border-dashed border-[#CFCFC8] bg-white/70 p-3.5 text-xs text-[#5C5C57]">
                          ⏳ Test schedule, physical venue, and syllabus will be published here by the hiring team shortly.
                        </div>
                      )}

                    {/* Practical Assessment: description from recruiter if published for this candidate */}
                    {Boolean(result?.isPublished) &&
                      round.type === "ASSESSMENT" &&
                      round.config?.description && (
                        <div className="mt-4 rounded-xl border border-[#2F4BFF]/30 bg-[#EEF2FF]/60 p-4 text-xs space-y-2">
                          <span className="font-semibold text-sm text-[#101010] flex items-center gap-1.5">
                            🧪 Assessment Brief
                          </span>
                          <p className="text-xs text-[#101010] whitespace-pre-wrap leading-relaxed">
                            {round.config.description}
                          </p>
                        </div>
                      )}

                    {/* Notice if ASSESSMENT round is current but recruiter hasn't published brief yet for this candidate */}
                    {isCurrent &&
                      round.type === "ASSESSMENT" &&
                      (!result?.isPublished || !round.config?.description) && (
                        <div className="mt-3 rounded-xl border border-dashed border-[#CFCFC8] bg-white/70 p-3.5 text-xs text-[#5C5C57]">
                          ⏳ Assessment brief and instructions will be published here by the hiring team shortly.
                        </div>
                      )}

                    {/* Practical Assessment: submission form / submitted state (only if published for candidate) */}
                    {round.type === "ASSESSMENT" && isCurrent && Boolean(result?.isPublished) && (
                      (() => {
                        const submission = result?.submissionData;
                        const alreadySubmitted = Boolean(submission?.githubUrl || submission?.otherUrl);
                        const isSubmitting = Boolean(assessmentSubmitting[round.id]);
                        const didSucceed = Boolean(assessmentSuccess[round.id]);
                        const submitErr = assessmentError[round.id];

                        return (
                          <div className="mt-4 rounded-xl border border-[#E3E3DD] bg-white p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEDE8] pb-2">
                              <span className="font-semibold text-sm text-[#101010]">
                                📤 Submit Your Assessment
                              </span>
                              {alreadySubmitted && (
                                <span className="rounded-full bg-[#E6F4EA] border border-[#A8DBB5] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B6B3A]">
                                  ✓ Submitted
                                </span>
                              )}
                            </div>

                            {alreadySubmitted && !didSucceed ? (
                              <div className="space-y-2 text-xs text-[#5C5C57]">
                                <p className="text-[#1B6B3A] font-medium">
                                  ✓ Your submission has been received. The recruiter will review it and update your status.
                                </p>
                                {submission?.githubUrl && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#8A8A84]">GitHub:</span>
                                    <a
                                      href={submission.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[#2F4BFF] hover:underline truncate"
                                    >
                                      {submission.githubUrl}
                                    </a>
                                  </div>
                                )}
                                {submission?.otherUrl && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#8A8A84]">Other link:</span>
                                    <a
                                      href={submission.otherUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[#2F4BFF] hover:underline truncate"
                                    >
                                      {submission.otherUrl}
                                    </a>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssessmentGithub((p) => ({ ...p, [round.id]: submission?.githubUrl || "" }));
                                    setAssessmentOther((p) => ({ ...p, [round.id]: submission?.otherUrl || "" }));
                                    setAssessmentSuccess((p) => ({ ...p, [round.id]: false }));
                                  }}
                                  className="mt-1 text-[11px] text-[#5C5C57] underline cursor-pointer"
                                >
                                  Update submission
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {didSucceed && (
                                  <div className="rounded-xl border border-[#A8DBB5] bg-[#E6F4EA] px-3 py-2 text-xs font-medium text-[#1B6B3A]">
                                    ✓ Submitted successfully! The recruiter will review your work.
                                  </div>
                                )}
                                {submitErr && (
                                  <div className="rounded-xl border border-[#F2C4BF] bg-[#FCE9E7] px-3 py-2 text-xs text-[#A8281E]">
                                    {submitErr}
                                  </div>
                                )}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-medium text-[#5C5C57]">
                                    GitHub Repository URL
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://github.com/your-username/project"
                                    value={assessmentGithub[round.id] || ""}
                                    onChange={(e) =>
                                      setAssessmentGithub((p) => ({ ...p, [round.id]: e.target.value }))
                                    }
                                    className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-medium text-[#5C5C57]">
                                    Other Link{" "}
                                    <span className="text-[#8A8A84] font-normal">(optional — demo, portfolio, video, etc.)</span>
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://your-demo.vercel.app"
                                    value={assessmentOther[round.id] || ""}
                                    onChange={(e) =>
                                      setAssessmentOther((p) => ({ ...p, [round.id]: e.target.value }))
                                    }
                                    className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={isSubmitting || (!assessmentGithub[round.id]?.trim() && !assessmentOther[round.id]?.trim())}
                                  onClick={() => handleAssessmentSubmit(round.id)}
                                  className="w-full min-h-9 cursor-pointer rounded-full bg-[#101010] text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                                >
                                  {isSubmitting ? "Submitting..." : alreadySubmitted ? "Update Submission" : "Submit Assessment"}
                                </button>
                                <p className="text-[11px] text-[#8A8A84]">
                                  You can update your submission at any time before the recruiter makes a decision.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {/* External test link if available */}
                    {round.externalUrl && !round.config?.mapUrl && (
                      <div className="mt-3">
                        <a
                          href={round.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#2F4BFF] hover:underline"
                        >
                          Open Round Material / Link ↗
                        </a>
                      </div>
                    )}

                    {/* Published Score */}
                    {result?.score != null && (
                      <div className="mt-3 font-mono text-xs text-[#101010]">
                        Score:{" "}
                        <strong className="text-[#2F4BFF]">
                          {result.score}
                        </strong>{" "}
                        / 100
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info note */}
        <div className="text-center font-mono text-xs text-[#8A8A84]">
          HireFire Candidate Portal · Updates in real time · Keep your tracking
          link confidential
        </div>
      </div>
    </div>
  );
}

export default function CandidateTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E3E3DD] border-t-[#2F4BFF]" />
        </div>
      }
    >
      <TrackingPortalContent />
    </Suspense>
  );
}
