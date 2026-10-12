"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { apiFetch, API_BASE_URL } from "../../../../lib/api";
import type {
  Position,
  PositionStatus,
  Application,
  HiringRound,
} from "../../../../lib/types";

const STATUS_STYLES: Record<Position["status"], string> = {
  OPEN: "bg-[#E6F4EA] text-[#1B6B3A]",
  DRAFT: "bg-[#F1F1EC] text-[#5C5C57]",
  CLOSED: "bg-[#FCE9E7] text-[#A8281E]",
  ARCHIVED: "bg-[#F1F1EC] text-[#8A8A84]",
};

function WrittenTestSetupCard({
  round,
  positionId,
  onRoundUpdated,
}: {
  round: HiringRound;
  positionId: string;
  onRoundUpdated: (updated: HiringRound) => void;
}) {
  const config = (round.config || {}) as {
    testDate?: string;
    location?: string;
    mapUrl?: string;
    syllabus?: string;
    isPublished?: boolean;
    publishedAt?: string;
  };

  const [testDate, setTestDate] = useState(config.testDate || "");
  const [location, setLocation] = useState(config.location || "");
  const [mapUrl, setMapUrl] = useState(
    config.mapUrl || round.externalUrl || "",
  );
  const [syllabus, setSyllabus] = useState(
    config.syllabus || round.instructions || "",
  );
  const isPublished = Boolean(config.isPublished) || Boolean(round.publishedAt);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const cfg = (round.config || {}) as {
      testDate?: string;
      location?: string;
      mapUrl?: string;
      syllabus?: string;
      isPublished?: boolean;
      publishedAt?: string;
    };
    setTestDate(cfg.testDate || "");
    setLocation(cfg.location || "");
    setMapUrl(cfg.mapUrl || round.externalUrl || "");
    setSyllabus(cfg.syllabus || round.instructions || "");
  }, [round.id, round.config, round.externalUrl, round.instructions]);

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await apiFetch<{ round: HiringRound; message: string }>(
        `/api/positions/${positionId}/rounds/${round.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            testDate: testDate || null,
            location: location.trim() || null,
            mapUrl: mapUrl.trim() || null,
            syllabus: syllabus.trim() || null,
            isPublished: publish,
          }),
        },
      );
      onRoundUpdated(res.round);
      setSuccessMsg(
        publish
          ? "✓ Published successfully! Candidates can now view test details on their tracking portal."
          : "✓ Draft saved. Details remain hidden from candidates until published.",
      );
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to update test details",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-[#C5D1FA] bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEDE8] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2F4BFF]">
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </span>
          <div>
            <h4 className="font-semibold text-sm text-[#101010]">
              Written Test & Venue Publication
            </h4>
            <p className="text-xs text-[#5C5C57]">
              Configure test date, venue location, map link, and syllabus to publish on candidate tracking portals.
            </p>
          </div>
        </div>

        {/* Publication Status Pill */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isPublished
              ? "bg-[#E6F4EA] text-[#1B6B3A] border border-[#A8DBB5]"
              : "bg-[#F1F1EC] text-[#5C5C57] border border-[#E3E3DD]"
          }`}
        >
          {isPublished ? "● Published to Candidates" : "○ Draft (Unpublished)"}
        </span>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-[#A8DBB5] bg-[#E6F4EA] px-3.5 py-2 text-xs font-medium text-[#1B6B3A]">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-[#F2C4BF] bg-[#FCE9E7] px-3.5 py-2 text-xs font-medium text-[#A8281E]">
          {errorMsg}
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Date & Time */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#5C5C57]">
            Test Date & Time <span className="text-[#A8281E]">*</span>
          </label>
          <input
            type="datetime-local"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] focus:border-[#101010] focus:outline-none"
          />
        </div>

        {/* Location / Venue */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#5C5C57]">
            Physical Venue / Location <span className="text-[#A8281E]">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Main Campus, Block B, Examination Hall 2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
          />
        </div>

        {/* Map Link */}
        <div className="space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-[#5C5C57]">
              Google Maps Link
            </label>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-[#2F4BFF] hover:underline"
              >
                Test Link ↗
              </a>
            )}
          </div>
          <input
            type="url"
            placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
          />
        </div>

        {/* Description / Syllabus Box */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-medium text-[#5C5C57]">
            Description & Syllabus Box
          </label>
          <textarea
            rows={4}
            placeholder="Outline the syllabus, topics covered, test duration, question format (MCQ/written), and what items candidates must bring (ID card, pens, etc.)..."
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            className="w-full rounded-xl border border-[#CFCFC8] bg-white p-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EDEDE8]">
        <p className="text-[11px] text-[#8A8A84]">
          Candidates in this stage will see these details on their tracking portal once published.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="min-h-8 cursor-pointer rounded-full border border-[#CFCFC8] bg-white px-4 text-xs font-medium text-[#5C5C57] transition-colors hover:border-[#101010] hover:text-[#101010] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(!isPublished)}
            className={`min-h-8 cursor-pointer rounded-full px-4 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
              isPublished
                ? "bg-[#A8281E]"
                : "bg-[#2F4BFF]"
            }`}
          >
            {saving
              ? "Saving..."
              : isPublished
                ? "Unpublish Details"
                : "Publish to Candidates"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PositionDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const queryTab = searchParams?.get("tab") as
    | "overview"
    | "applicants"
    | "rounds"
    | null;
  const queryStage = searchParams?.get("stage");

  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "applicants" | "rounds"
  >(queryTab || "overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Announce email state
  const [announceTo, setAnnounceTo] = useState("");
  const [announceSubject, setAnnounceSubject] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announcing, setAnnouncing] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState(false);
  const [announceError, setAnnounceError] = useState<string | null>(null);

  // Evaluation & Stage filter state
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>(
    queryStage || "",
  );
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
    if (queryStage) setSelectedStageFilter(queryStage);
  }, [queryTab, queryStage]);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ position: Position }>(`/api/positions/${id}`)
      .then((data) => {
        setPosition(data.position);
        if (data.position.announcementSubject)
          setAnnounceSubject(data.position.announcementSubject);
        if (data.position.announcementBody)
          setAnnounceBody(data.position.announcementBody);
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
    if (!announceTo.trim()) {
      setAnnounceError("At least one recipient is required.");
      return;
    }
    if (!announceSubject.trim()) {
      setAnnounceError("Subject is required.");
      return;
    }
    if (!announceBody.trim()) {
      setAnnounceError("Body is required.");
      return;
    }

    setAnnouncing(true);
    setAnnounceError(null);
    setAnnounceSuccess(false);
    try {
      await apiFetch(`/api/positions/${position.id}/announce`, {
        method: "POST",
        body: JSON.stringify({
          to: announceTo
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          subject: announceSubject.trim(),
          body: announceBody.trim(),
        }),
      });
      setAnnounceSuccess(true);
      setTimeout(() => setAnnounceSuccess(false), 4000);
    } catch (err: unknown) {
      setAnnounceError(
        err instanceof Error ? err.message : "Failed to send announcement",
      );
    } finally {
      setAnnouncing(false);
    }
  };

  const handleEvaluate = async (
    applicationId: string,
    decision: "PASS" | "FAIL",
  ) => {
    if (!position) return;
    setEvaluatingId(applicationId);
    try {
      const res = await apiFetch<{
        message: string;
        application: Application;
      }>(`/api/applications/${applicationId}/evaluate`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });

      setPosition((prev) => {
        if (!prev) return prev;
        const updatedApplications = (prev.applications || []).map((app) =>
          app.id === applicationId ? res.application : app,
        );
        return {
          ...prev,
          applications: updatedApplications,
        };
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to evaluate candidate");
    } finally {
      setEvaluatingId(null);
    }
  };

  // Helper to determine an applicant's current stage and status
  const getApplicantStage = (app: Application, rounds: HiringRound[]) => {
    if (app.status === "HIRED")
      return { key: "hired", label: "Hired", isFinal: true, isLastRound: false };
    if (app.status === "REJECTED")
      return { key: "rejected", label: "Rejected", isFinal: true, isLastRound: false };

    const roundResults = app.roundResults || [];
    const activeResult = roundResults.find(
      (r) => r.status === "PENDING" || r.status === "IN_PROGRESS",
    );
    if (activeResult) {
      const round = rounds.find((r) => r.id === activeResult.roundId);
      if (round) {
        const isLastRound =
          rounds.length > 0 &&
          round.order === Math.max(...rounds.map((r) => r.order));
        return {
          key: round.id,
          label: round.title,
          round,
          isLastRound,
          isFinal: false,
        };
      }
    }

    const passedRoundIds = new Set(
      roundResults
        .filter((r) => r.status === "PASSED")
        .map((r) => r.roundId),
    );
    const nextRound = rounds.find((r) => !passedRoundIds.has(r.id));
    if (nextRound) {
      const isLastRound =
        rounds.length > 0 &&
        nextRound.order === Math.max(...rounds.map((r) => r.order));
      return {
        key: nextRound.id,
        label: nextRound.title,
        round: nextRound,
        isLastRound,
        isFinal: false,
      };
    }

    const firstRound = rounds[0];
    return {
      key: firstRound?.id || "unknown",
      label: firstRound?.title || "Screening",
      round: firstRound,
      isLastRound: rounds.length <= 1,
      isFinal: false,
    };
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
          <p className="font-semibold text-base">
            Position not found or unavailable
          </p>
          <p className="mt-1 text-xs text-[#A8281E]/90">
            {error ||
              "The requested position could not be retrieved from the backend."}
          </p>
        </div>
      </div>
    );
  }

  const rounds = position.rounds || [];
  const applicants = position.applications || [];

  // Count applicants in each stage
  const stageCounts: Record<string, number> = {
    hired: applicants.filter((a) => a.status === "HIRED").length,
    rejected: applicants.filter((a) => a.status === "REJECTED").length,
  };

  rounds.forEach((round) => {
    stageCounts[round.id] = applicants.filter((a) => {
      const stage = getApplicantStage(a, rounds);
      return stage.key === round.id;
    }).length;
  });

  // Current first in-process application round (or first round if none currently in-process)
  const defaultRound =
    rounds.find((r) => (stageCounts[r.id] || 0) > 0) || rounds[0];
  const activeFilter =
    selectedStageFilter &&
    (selectedStageFilter === "hired" ||
      selectedStageFilter === "rejected" ||
      rounds.some((r) => r.id === selectedStageFilter))
      ? selectedStageFilter
      : defaultRound?.id || "";

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
              {position.status.charAt(0) +
                position.status.slice(1).toLowerCase()}
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
          { key: "rounds", label: `Hiring Pipeline (${rounds.length} Stages)` },
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

            {/* Announcement Email Template */}
            {(position.announcementSubject || position.announcementBody) && (
              <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
                <h2 className="text-base font-semibold text-[#101010]">
                  Saved Announcement Template
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
              <h3 className="text-sm font-semibold text-[#101010]">
                Application Form
              </h3>
              <p className="mt-1 text-xs text-[#5C5C57]">
                Share this link with candidates to start receiving
                applications.
              </p>
              <div className="mt-3 space-y-3">
                <p className="break-all rounded-lg border border-[#E3E3DD] bg-[#F6F6F3] p-2.5 font-mono text-xs text-[#5C5C57]">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/apply/${position.id}`
                    : `/apply/${position.id}`}
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
                <h3 className="text-sm font-semibold text-[#101010]">
                  Send Announcement
                </h3>
                <p className="mt-0.5 text-xs text-[#5C5C57]">
                  Email candidates about this opening and include your form
                  link.
                </p>
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
                <label className="block text-xs font-medium text-[#5C5C57]">
                  To <span className="text-[#A8281E]">*</span>
                </label>
                <input
                  type="text"
                  value={announceTo}
                  onChange={(e) => setAnnounceTo(e.target.value)}
                  placeholder="candidates@example.com, hr@company.com"
                  className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                />
                <p className="text-[11px] text-[#8A8A84]">
                  Separate multiple addresses with commas
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C5C57]">
                  Subject <span className="text-[#A8281E]">*</span>
                </label>
                <input
                  type="text"
                  value={announceSubject}
                  onChange={(e) => setAnnounceSubject(e.target.value)}
                  placeholder={`We are hiring: ${position.title}`}
                  className="min-h-9 w-full rounded-xl border border-[#CFCFC8] bg-white px-3 text-xs text-[#101010] placeholder-[#8A8A84] focus:border-[#101010] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C5C57]">
                  Body <span className="text-[#A8281E]">*</span>
                </label>
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
          </div>
        </div>
      )}

      {/* Tab 2: Applicants with Pipeline Stage Tabs */}
      {activeTab === "applicants" && (
        <div className="space-y-6">
          {/* Top Row: Category Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E3E3DD] bg-[#FAFAF8] p-3 shadow-2xs">
            <span className="text-xs font-medium text-[#5C5C57]">
              Pipeline Decisions
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedStageFilter("hired")}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeFilter === "hired"
                    ? "bg-[#1B6B3A] text-white shadow-xs"
                    : "bg-white border border-[#A8DBB5] text-[#1B6B3A] hover:bg-[#E6F4EA]"
                }`}
              >
                ✓ Hired ({stageCounts.hired || 0})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStageFilter("rejected")}
                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeFilter === "rejected"
                    ? "bg-[#A8281E] text-white shadow-xs"
                    : "bg-white border border-[#F2C4BF] text-[#A8281E] hover:bg-[#FCE9E7]"
                }`}
              >
                ✗ Rejected ({stageCounts.rejected || 0})
              </button>
            </div>
          </div>

          {/* Progressive Rounds in Same Row (Horizontal Pipeline Stepper) */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {rounds.map((round, idx) => {
                const isSelected = activeFilter === round.id;
                const count = stageCounts[round.id] || 0;
                return (
                  <div key={round.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStageFilter(round.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[#2F4BFF] text-white shadow-xs ring-2 ring-[#2F4BFF]/20"
                          : "bg-white border border-[#E3E3DD] text-[#101010] hover:border-[#2F4BFF]"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          isSelected
                            ? "bg-white text-[#2F4BFF]"
                            : "bg-[#F1F1EC] text-[#5C5C57]"
                        }`}
                      >
                        {round.order}
                      </span>
                      <span>{round.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : count > 0
                              ? "bg-[#EEF2FF] text-[#2F4BFF]"
                              : "bg-[#F1F1EC] text-[#8A8A84]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>

                    {/* Arrow separator */}
                    {idx < rounds.length - 1 && (
                      <svg
                        className="h-4 w-4 text-[#CFCFC8] shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Render Candidate Sections */}
          {activeFilter === "hired" ? (
            /* HIRED CANDIDATES VIEW */
            <div className="rounded-[22px] border border-[#A8DBB5] bg-[#E6F4EA]/40 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#A8DBB5]/60 pb-3">
                <h3 className="text-base font-semibold text-[#1B6B3A]">
                  ✓ Hired Candidates ({stageCounts.hired || 0})
                </h3>
              </div>
              {applicants.filter((a) => a.status === "HIRED").length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#A8DBB5] bg-white/60 p-8 text-center text-xs text-[#1B6B3A]">
                  No candidates have been hired yet. Pass candidates through
                  all stages to hire them.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicants
                    .filter((a) => a.status === "HIRED")
                    .map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#A8DBB5] bg-white p-4 shadow-xs"
                      >
                        <div>
                          <h4 className="font-semibold text-base text-[#101010]">
                            {app.candidate?.name}
                          </h4>
                          <p className="font-mono text-xs text-[#5C5C57]">
                            {app.candidate?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/recruiter/candidates/${app.candidateId}?from=${encodeURIComponent(`/recruiter/positions/${position.id}?tab=applicants&stage=hired`)}`}
                            className="inline-flex min-h-8 items-center rounded-full border border-[#CFCFC8] px-3 text-xs font-medium text-[#5C5C57] transition-colors hover:border-[#101010] hover:text-[#101010]"
                          >
                            Profile
                          </Link>
                          <span className="rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-semibold text-[#1B6B3A]">
                            ✓ Cleared All Stages & Hired
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : activeFilter === "rejected" ? (
            /* REJECTED CANDIDATES VIEW */
            <div className="rounded-[22px] border border-[#F2C4BF] bg-[#FCE9E7]/40 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2C4BF]/60 pb-3">
                <h3 className="text-base font-semibold text-[#A8281E]">
                  ✗ Rejected Candidates ({stageCounts.rejected || 0})
                </h3>
              </div>
              {applicants.filter((a) => a.status === "REJECTED").length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-[#F2C4BF] bg-white/60 p-8 text-center text-xs text-[#A8281E]">
                  No rejected candidates.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicants
                    .filter((a) => a.status === "REJECTED")
                    .map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#F2C4BF] bg-white p-4 shadow-xs"
                      >
                        <div>
                          <h4 className="font-semibold text-base text-[#101010]">
                            {app.candidate?.name}
                          </h4>
                          <p className="font-mono text-xs text-[#5C5C57]">
                            {app.candidate?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/recruiter/candidates/${app.candidateId}?from=${encodeURIComponent(`/recruiter/positions/${position.id}?tab=applicants&stage=rejected`)}`}
                            className="inline-flex min-h-8 items-center rounded-full border border-[#CFCFC8] px-3 text-xs font-medium text-[#5C5C57] transition-colors hover:border-[#101010] hover:text-[#101010]"
                          >
                            Profile
                          </Link>
                          <span className="rounded-full bg-[#FCE9E7] px-3 py-1 text-xs font-semibold text-[#A8281E]">
                            Not Selected
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            /* SINGLE STAGE VIEW */
            (() => {
              const round = rounds.find((r) => r.id === activeFilter);
              const stageApplicants = applicants.filter((a) => {
                const stage = getApplicantStage(a, rounds);
                return stage.key === activeFilter;
              });

              return (
                <div className="rounded-[22px] border border-[#E3E3DD] bg-[#FAFAF8] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEDE8] pb-3">
                    <div className="flex items-center gap-3">
                      {round && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F4BFF] text-xs font-bold text-white">
                          {round.order}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-[#101010]">
                            {round?.title || "Selected Stage"}
                          </h3>
                          {round && (
                            <span className="rounded bg-[#EDEDE8] px-2 py-0.5 font-mono text-[11px] text-[#5C5C57]">
                              {round.type}
                            </span>
                          )}
                        </div>
                        {round?.instructions && (
                          <p className="mt-0.5 text-xs text-[#5C5C57]">
                            {round.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="rounded-full border border-[#E3E3DD] bg-white px-3 py-1 font-mono text-xs font-semibold text-[#101010]">
                      {stageApplicants.length}{" "}
                      {stageApplicants.length === 1
                        ? "applicant"
                        : "applicants"}
                    </span>
                  </div>

                  {/* Written Test & Quiz Setup (for TEST round or title containing test/quiz) */}
                  {round &&
                    (round.type === "TEST" ||
                      round.title.toLowerCase().includes("test") ||
                      round.title.toLowerCase().includes("quiz")) && (
                      <WrittenTestSetupCard
                        round={round}
                        positionId={position.id}
                        onRoundUpdated={(updatedRound) => {
                          setPosition((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              rounds: (prev.rounds || []).map((r) =>
                                r.id === updatedRound.id ? updatedRound : r,
                              ),
                            };
                          });
                        }}
                      />
                    )}

                  {stageApplicants.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#CFCFC8] bg-white/60 p-8 text-center text-xs text-[#8A8A84]">
                      No candidates currently in this stage.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stageApplicants.map((app) => {
                        const stage = getApplicantStage(app, rounds);
                        const rawAnswers = (app.rawAnswers || {}) as {
                          phone?: string;
                          description?: string;
                        };

                        return (
                          <div
                            key={app.id}
                            className="rounded-[18px] border border-[#E3E3DD] bg-white p-5 shadow-xs hover:border-[#CFCFC8] transition-colors"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold text-base text-[#101010]">
                                    {app.candidate?.name || "Unknown"}
                                  </h4>
                                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-medium text-[#2F4BFF]">
                                    {stage.label}
                                  </span>
                                </div>

                                <p className="font-mono text-xs text-[#5C5C57]">
                                  {app.candidate?.email || "No email"}
                                  {rawAnswers.phone &&
                                    ` · ${rawAnswers.phone}`}
                                </p>
                                <p className="text-xs text-[#8A8A84]">
                                  Applied on{" "}
                                  {new Date(
                                    app.appliedAt || app.createdAt,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {app.resumeUrl && (
                                  <a
                                    href={
                                      app.resumeUrl.startsWith("http")
                                        ? app.resumeUrl
                                        : `${API_BASE_URL}${app.resumeUrl.startsWith("/") ? "" : "/"}${app.resumeUrl}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#CFCFC8] bg-white px-3 text-xs font-medium text-[#101010] transition-colors hover:border-[#101010]"
                                  >
                                    <svg
                                      className="h-3.5 w-3.5 text-[#5C5C57]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                      />
                                    </svg>
                                    View Resume ↗
                                  </a>
                                )}

                                <Link
                                  href={`/recruiter/candidates/${app.candidateId}?from=${encodeURIComponent(`/recruiter/positions/${position.id}?tab=applicants${activeFilter ? `&stage=${activeFilter}` : ""}`)}`}
                                  className="inline-flex min-h-8 items-center rounded-full border border-[#CFCFC8] px-3 text-xs font-medium text-[#5C5C57] transition-colors hover:border-[#101010] hover:text-[#101010]"
                                >
                                  Profile
                                </Link>

                                <button
                                  type="button"
                                  disabled={evaluatingId === app.id}
                                  onClick={() =>
                                    handleEvaluate(app.id, "PASS")
                                  }
                                  className="inline-flex min-h-8 cursor-pointer items-center rounded-full bg-[#1B6B3A] px-3.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                  {evaluatingId === app.id
                                    ? "Updating..."
                                    : stage.isLastRound
                                      ? "✓ Hire Candidate"
                                      : "✓ Pass to Next Round"}
                                </button>
                                <button
                                  type="button"
                                  disabled={evaluatingId === app.id}
                                  onClick={() =>
                                    handleEvaluate(app.id, "FAIL")
                                  }
                                  className="inline-flex min-h-8 cursor-pointer items-center rounded-full border border-[#F2C4BF] bg-[#FCE9E7] px-3.5 text-xs font-medium text-[#A8281E] transition-colors hover:bg-[#F9D6D2] disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>

                            {rawAnswers.description && (
                              <div className="mt-3 rounded-xl border border-[#EDEDE8] bg-[#FAFAF8] p-3 text-xs text-[#5C5C57] leading-relaxed">
                                <strong className="text-[#101010]">
                                  Cover Note:
                                </strong>{" "}
                                {rawAnswers.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Tab 3: Hiring Pipeline Stages */}
      {activeTab === "rounds" && (
        <div className="space-y-4">
          <div className="rounded-[20px] border border-[#E3E3DD] bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-[#101010]">
              Evaluation Pipeline
            </h2>
            <p className="mt-1 text-sm text-[#5C5C57]">
              Sequential stages configured for this position. Candidates progress
              through these rounds as you evaluate and pass them.
            </p>

            <div className="mt-6 space-y-4">
              {rounds.map((round) => {
                const countInRound = stageCounts[round.id] || 0;
                return (
                  <div
                    key={round.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#EDEDE8] p-4 bg-[#FAFAF8]"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101010] text-xs font-semibold text-white">
                        {round.order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-[#101010]">
                            {round.title}
                          </p>
                          <span className="font-mono text-[11px] text-[#8A8A84] rounded bg-[#E3E3DD] px-1.5 py-0.5">
                            {round.type}
                          </span>
                        </div>
                        {round.instructions && (
                          <p className="mt-1 text-xs text-[#5C5C57]">
                            {round.instructions}
                          </p>
                        )}
                        {round.config?.testDate && (
                          <p className="mt-1 text-xs font-medium text-[#2F4BFF]">
                            📅 Test Date:{" "}
                            {new Date(round.config.testDate).toLocaleString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {round.config?.location && (
                          <p className="mt-0.5 text-xs text-[#5C5C57]">
                            📍 Venue: {round.config.location}
                          </p>
                        )}
                        {round.config?.isPublished && (
                          <span className="mt-1.5 inline-block rounded-full bg-[#E6F4EA] border border-[#A8DBB5] px-2.5 py-0.5 text-[10px] font-semibold text-[#1B6B3A]">
                            ✓ Published to Candidates
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-white border border-[#E3E3DD] px-3 py-1 font-mono text-xs font-medium text-[#101010]">
                        {countInRound} {countInRound === 1 ? "applicant" : "applicants"} currently
                      </span>
                    </div>
                  </div>
                );
              })}
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
