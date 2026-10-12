"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "../../../../lib/api";
import type { Position, PositionStatus } from "../../../../lib/types";

export default function NewPositionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<PositionStatus>("OPEN");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Position title is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        status,
        description: description.trim() || undefined,
      };

      const result = await apiFetch<{ position: Position }>("/api/positions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.position?.id) {
        router.push(`/recruiter/positions/${result.position.id}`);
      } else {
        router.push("/recruiter/positions");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create position. Backend may not be ready.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 font-sans text-[#101010]">
      {/* Header & Back Link */}
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
          Back to positions
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          New position
        </h1>
        <p className="mt-2 text-base text-[#5C5C57]">
          Create a position to start collecting applications and managing hiring rounds.
        </p>
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
            <p className="font-semibold">Unable to create position</p>
            <p className="mt-0.5 text-xs text-[#A8281E]/90">{error}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="space-y-7 rounded-[20px] border border-[#E3E3DD] bg-white p-6 sm:p-8 shadow-xs"
      >
        {/* Title */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-[#101010]"
          >
            Position title <span className="text-[#A8281E]">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="min-h-11 w-full rounded-xl border border-[#CFCFC8] bg-white px-4 text-[15px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
          />
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#101010]">
            Initial Status
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              {
                value: "OPEN",
                label: "Open",
                desc: "Visible and accepting responses",
                style: "bg-[#E6F4EA] text-[#1B6B3A] border-[#A8DBB5]",
              },
              {
                value: "DRAFT",
                label: "Draft",
                desc: "Work in progress, not yet open",
                style: "bg-[#F1F1EC] text-[#5C5C57] border-[#CFCFC8]",
              },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex flex-1 min-w-[200px] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  status === option.value
                    ? "border-[#101010] bg-[#FAFAF8] shadow-xs"
                    : "border-[#E3E3DD] bg-white hover:border-[#CFCFC8]"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value as PositionStatus)}
                  className="mt-1 h-4 w-4 text-[#2F4BFF]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#101010]">
                      {option.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${option.style}`}
                    >
                      {option.value}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5C5C57]">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-[#101010]"
          >
            Job Description
          </label>
          <textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline the responsibilities, required experience, expectations, and role criteria..."
            className="w-full rounded-xl border border-[#CFCFC8] bg-white p-4 text-[14px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
          />
        </div>

        {/* Application form note */}
        <div className="rounded-xl border border-[#E3E3DD] bg-[#F6F6F3] p-4">
          <p className="text-sm font-semibold text-[#101010]">Application form</p>
          <p className="mt-1 text-xs text-[#5C5C57]">
            A public application form (Name, Email, Phone, Resume, Cover note) will be automatically
            created for this position. You can copy and share the form link from the position detail page
            after creating it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-[#EDEDE8] pt-6">
          <Link
            href="/recruiter/positions"
            className="flex min-h-11 items-center rounded-full border border-[#CFCFC8] px-5 text-[14px] font-medium text-[#5C5C57] transition-colors hover:border-[#101010] hover:text-[#101010]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#2F4BFF] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#2340E6] disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create position"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
