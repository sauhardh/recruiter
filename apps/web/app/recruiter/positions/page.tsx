"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../../lib/api";
import type { Position } from "../../../lib/types";

const STATUS_STYLES: Record<Position["status"], string> = {
  OPEN: "bg-[#E6F4EA] text-[#1B6B3A]",
  DRAFT: "bg-[#F1F1EC] text-[#5C5C57]",
  CLOSED: "bg-[#FCE9E7] text-[#A8281E]",
  ARCHIVED: "bg-[#F1F1EC] text-[#8A8A84]",
};

const cols = "grid grid-cols-[2.8fr_1.2fr_1fr_1.2fr_1fr] items-center gap-4";

type FilterTab = "ALL" | "OPEN" | "DRAFT" | "CLOSED" | "ARCHIVED";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    apiFetch<{ positions: Position[] }>("/api/positions")
      .then((data) => {
        setPositions(data.positions || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to load positions");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      const matchesTab = activeTab === "ALL" || pos.status === activeTab;
      const matchesSearch =
        search.trim() === "" ||
        pos.title.toLowerCase().includes(search.toLowerCase()) ||
        (pos.description &&
          pos.description.toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [positions, activeTab, search]);

  return (
    <div className="space-y-10 font-sans text-[#101010]">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] tracking-[0.04em] text-[#5C5C57]">
            Recruiter
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Positions
          </h1>
        </div>
        <Link
          href="/recruiter/positions/new"
          className="flex min-h-11 items-center gap-2 rounded-full bg-[#2F4BFF] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#2340E6]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New position
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-full border border-[#E3E3DD] bg-white p-1">
          {(["ALL", "OPEN", "DRAFT", "CLOSED", "ARCHIVED"] as FilterTab[]).map(
            (tab) => {
              const count =
                tab === "ALL"
                  ? positions.length
                  : positions.filter((p) => p.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex min-h-8 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-[#101010] text-[#F6F6F3]"
                      : "text-[#5C5C57] hover:bg-[#F1F1EC] hover:text-[#101010]"
                  }`}
                >
                  <span>
                    {tab === "ALL"
                      ? "All"
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                      activeTab === tab
                        ? "bg-[#333333] text-white"
                        : "bg-[#E3E3DD] text-[#5C5C57]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* Search Bar */}
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
            placeholder="Search positions..."
            className="min-h-10 w-full rounded-full border border-[#CFCFC8] bg-white pl-9 pr-4 text-[14px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
          />
        </div>
      </div>

      {/* Error state */}
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

      {/* Loading state */}
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
      {!loading && !error && filteredPositions.length === 0 && (
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
              <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-base font-medium">
            {search || activeTab !== "ALL"
              ? "No matching positions found"
              : "No positions yet"}
          </p>
          <p className="mt-1 text-sm text-[#5C5C57]">
            {search || activeTab !== "ALL"
              ? "Try adjusting your search query or status filter."
              : "Create an open position to start collecting applications."}
          </p>
          {!search && activeTab === "ALL" && (
            <Link
              href="/recruiter/positions/new"
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[#CFCFC8] px-5 text-[15px] font-medium transition-colors hover:border-[#101010]"
            >
              Create a position
            </Link>
          )}
        </div>
      )}

      {/* Positions Table */}
      {!loading && filteredPositions.length > 0 && (
        <div className="overflow-hidden rounded-[20px] border border-[#E3E3DD] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <div className="min-w-[760px] px-5 pb-3 pt-2">
              <div
                className={`${cols} border-b border-[#EDEDE8] py-3 font-mono text-xs text-[#8A8A84]`}
              >
                <span>Position</span>
                <span>Status</span>
                <span>Applicants</span>
                <span>Created</span>
                <span className="text-right">Action</span>
              </div>
              {filteredPositions.map((position, i) => (
                <div
                  key={position.id}
                  className={`${cols} py-4 text-[15px] ${
                    i < filteredPositions.length - 1
                      ? "border-b border-[#F3F3EF]"
                      : ""
                  }`}
                >
                  <div className="min-w-0 pr-4">
                    <Link
                      href={`/recruiter/positions/${position.id}`}
                      className="font-medium text-[#101010] hover:text-[#2F4BFF] transition-colors truncate block"
                    >
                      {position.title}
                    </Link>
                    {position.googleFormUrl && (
                      <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-[#8A8A84]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1B6B3A]" />
                        Form linked
                      </span>
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[13px] font-medium ${STATUS_STYLES[position.status]}`}
                    >
                      {position.status.charAt(0) +
                        position.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="text-[#5C5C57]">
                    {position._count?.applications ?? 0}
                  </div>
                  <div className="text-[#5C5C57] text-sm">
                    {new Date(position.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <Link
                      href={`/recruiter/positions/${position.id}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-[#CFCFC8] px-4 text-[13px] font-medium transition-colors hover:border-[#101010]"
                    >
                      View
                    </Link>
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
