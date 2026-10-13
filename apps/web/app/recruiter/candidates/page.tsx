"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getCandidates } from "../../../lib/candidates";
import type { Candidate, ApplicationStatus } from "../../../lib/types";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  ACTIVE: "bg-[#E6F4EA] text-[#1B6B3A]",
  HIRED: "bg-[#E6F0FF] text-[#2F4BFF]",
  REJECTED: "bg-[#FCE9E7] text-[#A8281E]",
  WITHDRAWN: "bg-[#F1F1EC] text-[#8A8A84]",
};

const cols = "grid grid-cols-[2.5fr_1.8fr_1.8fr_1fr_0.8fr] items-center gap-4";

type FilterStatus = "ALL" | ApplicationStatus;

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  useEffect(() => {
    getCandidates()
      .then((data) => {
        setCandidates(data.candidates || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to load candidates");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch =
        search.trim() === "" ||
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase()) ||
        (candidate.phone && candidate.phone.includes(search));

      const matchesStatus =
        statusFilter === "ALL" ||
        candidate.applications?.some((app) => app.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [candidates, search, statusFilter]);

  // Derived stats
  const totalCandidates = candidates.length;
  const totalActive = candidates.filter((c) =>
    c.applications?.some((a) => a.status === "ACTIVE"),
  ).length;
  const totalHired = candidates.filter((c) =>
    c.applications?.some((a) => a.status === "HIRED"),
  ).length;

  return (
    <div className="space-y-10 font-sans text-[#101010]">
      {/* Page Header */}
      <div>
        <p className="font-mono text-[13px] tracking-[0.04em] text-[#5C5C57]">
          Recruiter
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Candidates
        </h1>
        <p className="mt-2 text-base text-[#5C5C57]">
          Review all applicant profiles, evaluation milestones, and contact information.
        </p>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-1 border-t border-[#D9D9D2] sm:grid-cols-3">
        <div className="border-b border-[#D9D9D2] py-6 sm:border-b-0 sm:pr-7 sm:border-r">
          <p className="font-mono text-[13px] text-[#5C5C57]">Total candidates</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            {loading ? "—" : totalCandidates}
          </p>
        </div>
        <div className="border-b border-[#D9D9D2] py-6 sm:border-b-0 sm:px-7 sm:border-r">
          <p className="font-mono text-[13px] text-[#5C5C57]">Active applicants</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#1B6B3A]">
            {loading ? "—" : totalActive}
          </p>
        </div>
        <div className="py-6 sm:pl-7">
          <p className="font-mono text-[13px] text-[#5C5C57]">Hired candidates</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#2F4BFF]">
            {loading ? "—" : totalHired}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-full border border-[#E3E3DD] bg-white p-1">
          {(["ALL", "ACTIVE", "HIRED", "REJECTED"] as FilterStatus[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                  statusFilter === tab
                    ? "bg-[#101010] text-[#F6F6F3]"
                    : "text-[#5C5C57] hover:bg-[#F1F1EC] hover:text-[#101010]"
                }`}
              >
                {tab === "ALL"
                  ? "All"
                  : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ),
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px] sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A84]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="min-h-10 w-full rounded-full border border-[#CFCFC8] bg-white pl-9 pr-4 text-[14px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-4 text-sm text-[#A8281E]"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="font-semibold">Backend endpoint unavailable</p>
            <p className="mt-0.5 text-xs text-[#A8281E]/90">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-[#E3E3DD] bg-white"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCandidates.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-[#CFCFC8] bg-white px-6 py-20 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F1EC]">
            <svg
              className="h-5 w-5 text-[#8A8A84]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-base font-medium">
            {search || statusFilter !== "ALL"
              ? "No matching candidates found"
              : "No candidates yet"}
          </p>
          <p className="mt-1 text-sm text-[#5C5C57]">
            {search || statusFilter !== "ALL"
              ? "Try adjusting your search keywords or status filter."
              : "Candidates will appear here once responses are submitted or imported from Google Forms."}
          </p>
        </div>
      )}

      {/* Candidates Table */}
      {!loading && filteredCandidates.length > 0 && (
        <div className="overflow-hidden rounded-[20px] border border-[#E3E3DD] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <div className="min-w-[760px] px-5 pb-3 pt-2">
              <div
                className={`${cols} border-b border-[#EDEDE8] py-3 font-mono text-xs text-[#8A8A84]`}
              >
                <span>Candidate</span>
                <span>Applied For</span>
                <span>Email</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              {filteredCandidates.map((candidate, i) => {
                const primaryApplication = candidate.applications?.[0];
                const status = primaryApplication?.status || "ACTIVE";

                return (
                  <div
                    key={candidate.id}
                    className={`${cols} py-4 text-[15px] ${
                      i < filteredCandidates.length - 1
                        ? "border-b border-[#F3F3EF]"
                        : ""
                    }`}
                  >
                    {/* Candidate Name & Avatar */}
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#101010] text-xs font-semibold text-[#F6F6F3]">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 truncate">
                        <Link
                          href={`/recruiter/candidates/${candidate.id}`}
                          className="font-medium text-[#101010] hover:text-[#2F4BFF] transition-colors truncate block"
                        >
                          {candidate.name}
                        </Link>
                        {candidate.phone && (
                          <p className="font-mono text-xs text-[#8A8A84]">
                            {candidate.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Positions Applied For */}
                    <div className="min-w-0 pr-3">
                      {candidate.applications && candidate.applications.length > 0 ? (
                        <span className="text-sm text-[#101010] truncate block">
                          {candidate.applications[0].position?.title || "Application"}
                          {candidate.applications.length > 1 && (
                            <span className="ml-1 text-xs text-[#8A8A84]">
                              +{candidate.applications.length - 1} more
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-[#8A8A84]">—</span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="font-mono text-xs text-[#5C5C57] truncate pr-3">
                      {candidate.email}
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[12px] font-medium ${
                          STATUS_STYLES[status] || "bg-[#F1F1EC] text-[#5C5C57]"
                        }`}
                      >
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* View Button */}
                    <div className="text-right">
                      <Link
                        href={`/recruiter/candidates/${candidate.id}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-[#CFCFC8] px-4 text-[13px] font-medium transition-colors hover:border-[#101010]"
                      >
                        View
                      </Link>
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
