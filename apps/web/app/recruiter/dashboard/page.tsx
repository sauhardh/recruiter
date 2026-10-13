"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPositions } from "../../../lib/positions";
import type { Position, DashboardStats } from "../../../lib/types";

const STATUS_STYLES: Record<Position["status"], string> = {
  OPEN: "bg-[#E6F4EA] text-[#1B6B3A]",
  DRAFT: "bg-[#F1F1EC] text-[#5C5C57]",
  CLOSED: "bg-[#FCE9E7] text-[#A8281E]",
  ARCHIVED: "bg-[#F1F1EC] text-[#8A8A84]",
};

const cols = "grid grid-cols-[3fr_1.2fr_1fr_1.2fr_0.8fr] items-center gap-4";

export default function RecruiterDashboard() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Total position for dashboard
    getPositions()
      .then((data) => {
        setPositions(data.positions || []);
        setStats(data.stats || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12 font-sans text-[#101010]">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] tracking-[0.04em] text-[#5C5C57]">
            Recruiter
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Dashboard
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

      {/* Stats */}
      <div className="grid grid-cols-1 border-t border-[#D9D9D2] sm:grid-cols-3">
        <Stat
          label="Total positions"
          value={stats?.totalPositions ?? "—"}
          loading={loading}
        />
        <Stat
          label="Open positions"
          value={stats?.openPositions ?? "—"}
          loading={loading}
          accent
        />
        <Stat
          label="Total applicants"
          value={stats?.totalApplications ?? "—"}
          loading={loading}
        />
      </div>

      {/* Positions */}
      <section>
        <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.02em]">
          Your positions
        </h2>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-4 text-sm text-[#A8281E]"
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-[#E3E3DD] bg-white"
              />
            ))}
          </div>
        )}

        {!loading && !error && positions.length === 0 && (
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
            <p className="text-base font-medium">No positions yet</p>
            <p className="mt-1 text-sm text-[#5C5C57]">
              Create your first open position to start recruiting.
            </p>
            <Link
              href="/recruiter/positions/new"
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[#CFCFC8] px-5 text-[15px] font-medium transition-colors hover:border-[#101010]"
            >
              Create a position
            </Link>
          </div>
        )}

        {!loading && positions.length > 0 && (
          <div className="overflow-hidden rounded-[20px] border border-[#E3E3DD] bg-white">
            <div className="overflow-x-auto">
              <div className="min-w-[680px] px-5 pb-2 pt-1">
                <div
                  className={`${cols} border-b border-[#EDEDE8] py-3 font-mono text-xs text-[#8A8A84]`}
                >
                  <span>Position</span>
                  <span>Status</span>
                  <span>Applicants</span>
                  <span>Created</span>
                  <span />
                </div>
                {positions.map((position, i) => (
                  <div
                    key={position.id}
                    className={`${cols} py-4 text-[15px] ${
                      i < positions.length - 1
                        ? "border-b border-[#F3F3EF]"
                        : ""
                    }`}
                  >
                    <span className="font-medium">{position.title}</span>
                    <span>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[13px] font-medium ${STATUS_STYLES[position.status]}`}
                      >
                        {position.status.charAt(0) +
                          position.status.slice(1).toLowerCase()}
                      </span>
                    </span>
                    <span className="text-[#5C5C57]">
                      {position._count?.applications ?? 0}
                    </span>
                    <span className="text-[#5C5C57]">
                      {new Date(position.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span className="text-right">
                      <Link
                        href={`/recruiter/positions/${position.id}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-[#CFCFC8] px-4 text-[13px] font-medium transition-colors hover:border-[#101010]"
                      >
                        View
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
  accent = false,
}: {
  label: string;
  value: number | string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-[#D9D9D2] py-7 sm:border-b-0 sm:pr-7 sm:[&:not(:first-child)]:pl-7 sm:[&:not(:last-child)]:border-r">
      <p className="font-mono text-[13px] text-[#5C5C57]">{label}</p>
      {loading ? (
        <div className="mt-4 h-14 w-24 animate-pulse rounded-lg bg-[#E3E3DD]" />
      ) : (
        <p
          className={`mt-4 text-6xl font-semibold leading-none tracking-[-0.045em] ${
            accent ? "text-[#2F4BFF]" : ""
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
