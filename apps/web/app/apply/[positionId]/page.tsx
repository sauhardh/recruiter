"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PositionInfo {
  id: string;
  title: string;
  description?: string;
  status: string;
}

function ApplyForm() {
  const params = useParams();
  const positionId = params?.positionId as string;

  const [position, setPosition] = useState<PositionInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!positionId) return;
    fetch(`${API_BASE}/api/apply/${positionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLoadError(data.error);
        } else {
          setPosition(data.position);
        }
      })
      .catch(() =>
        setLoadError("Could not load this application form. Please try again."),
      )
      .finally(() => setLoading(false));
  }, [positionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setSubmitError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (description.trim())
        formData.append("description", description.trim());
      if (resumeFile) formData.append("resume", resumeFile);

      const res = await fetch(`${API_BASE}/api/apply/${positionId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit application.");
        return;
      }

      setTrackingToken(data.trackingToken);
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyToken = () => {
    if (!trackingToken) return;
    navigator.clipboard.writeText(trackingToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2500);
  };

  const copyTrackingLink = () => {
    if (!trackingToken) return;
    const url = `${window.location.origin}/track/${trackingToken}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
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
          Loading application form...
        </div>
      </div>
    );
  }

  if (loadError || !position) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3] p-6">
        <div className="max-w-md rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-8 text-center">
          <p className="font-semibold text-[#A8281E]">Form unavailable</p>
          <p className="mt-2 text-sm text-[#A8281E]/80">
            {loadError || "This application form could not be found."}
          </p>
        </div>
      </div>
    );
  }

  if (position.status !== "OPEN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3] p-6">
        <div className="max-w-md rounded-2xl border border-[#E3E3DD] bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F1EC]">
            <svg
              className="h-6 w-6 text-[#5C5C57]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-[#101010]">
            Applications closed
          </p>
          <p className="mt-2 text-sm text-[#5C5C57]">
            Applications for <strong>{position.title}</strong> are no longer
            being accepted.
          </p>
        </div>
      </div>
    );
  }

  if (submitted && trackingToken) {
    const trackingUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/track/${trackingToken}`
        : `/track/${trackingToken}`;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3] p-6">
        <div className="w-full max-w-lg rounded-[24px] border border-[#E3E3DD] bg-white p-8 shadow-xs text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4EA]">
            <svg
              className="h-7 w-7 text-[#1B6B3A]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
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
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#101010]">
              Application submitted!
            </h2>
            <p className="mt-2 text-sm text-[#5C5C57]">
              Thank you for applying to <strong>{position.title}</strong>. Your
              application is officially in review.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E3E3DD] bg-[#FAFAF8] p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[#8A8A84] uppercase tracking-wider">
                Candidate Tracking Portal
              </span>
              <span className="rounded-full bg-[#E6F4EA] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#1B6B3A]">
                Live
              </span>
            </div>
            <p className="text-xs text-[#5C5C57] leading-relaxed">
              We have set up a real-time portal for your application. You can view evaluation stages, see when tests or assessments are scheduled, and check interview details.
            </p>
            <div className="rounded-xl border border-[#E3E3DD] bg-white p-3">
              <p className="font-mono text-xs text-[#5C5C57] break-all select-all">
                {trackingUrl}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/track/${trackingToken}`}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#2F4BFF] text-[15px] font-semibold text-white transition-colors hover:bg-[#2340E6]"
            >
              Go to Tracking Portal →
            </Link>
            <button
              type="button"
              onClick={copyTrackingLink}
              className="w-full min-h-11 cursor-pointer rounded-full border border-[#CFCFC8] text-sm font-medium transition-colors hover:border-[#101010]"
            >
              {linkCopied ? "✓ Link Copied to Clipboard" : "Copy Tracking Link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] py-12 px-4">
      <div className="mx-auto max-w-xl space-y-6">
        {/* Header */}
        <div>
          <p className="font-mono text-xs tracking-[0.08em] text-[#8A8A84] uppercase">
            Application
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[#101010]">
            {position.title}
          </h1>
          {position.description && (
            <p className="mt-2 text-sm leading-relaxed text-[#5C5C57] whitespace-pre-wrap">
              {position.description}
            </p>
          )}
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="flex items-start gap-3 rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-4 text-sm text-[#A8281E]">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-[20px] border border-[#E3E3DD] bg-white p-6 sm:p-8 shadow-xs"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-[#101010]"
            >
              Full name <span className="text-[#A8281E]">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="min-h-11 w-full rounded-xl border border-[#CFCFC8] bg-white px-4 text-[15px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#101010]"
            >
              Email address <span className="text-[#A8281E]">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="min-h-11 w-full rounded-xl border border-[#CFCFC8] bg-white px-4 text-[15px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-[#101010]"
            >
              Phone number{" "}
              <span className="text-xs font-normal text-[#8A8A84]">
                (optional)
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="min-h-11 w-full rounded-xl border border-[#CFCFC8] bg-white px-4 text-[15px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
            />
          </div>

          {/* Resume upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#101010]">
              Resume / CV{" "}
              <span className="text-xs font-normal text-[#8A8A84]">
                (optional · PDF, DOC, DOCX · max 5 MB)
              </span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full min-h-11 cursor-pointer rounded-xl border-2 border-dashed px-4 text-sm transition-colors text-left ${
                resumeFile
                  ? "border-[#1B6B3A] bg-[#F0FAF3] text-[#1B6B3A]"
                  : "border-[#CFCFC8] text-[#8A8A84] hover:border-[#101010]"
              }`}
            >
              {resumeFile ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {resumeFile.name}
                </span>
              ) : (
                <span className="flex items-center gap-2 py-2">
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Click to upload resume
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Description / Cover note */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-[#101010]"
            >
              Cover note{" "}
              <span className="text-xs font-normal text-[#8A8A84]">
                (optional)
              </span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us a bit about yourself, your experience, and why you're interested in this role..."
              className="w-full rounded-xl border border-[#CFCFC8] bg-white p-4 text-[14px] text-[#101010] placeholder-[#8A8A84] transition-colors focus:border-[#101010] focus:outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-12 cursor-pointer rounded-full bg-[#2F4BFF] text-[15px] font-semibold text-white transition-colors hover:bg-[#2340E6] disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit application"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F6F3]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E3E3DD] border-t-[#2F4BFF]" />
        </div>
      }
    >
      <ApplyForm />
    </Suspense>
  );
}
