"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { getCurrentUser } from "../../lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [checking, setChecking] = useState(!error);

  useEffect(() => {
    if (error) {
      setChecking(false);
      return;
    }

    // Check if already authenticated
    getCurrentUser()
      .then(() => {
        router.replace("/recruiter/dashboard");
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router, error]);

  const getErrorMessage = (errCode: string) => {
    switch (errCode) {
      case "missing_auth_code":
        return "Authentication code was not received from Google.";
      case "email_not_provided":
        return "Google did not provide a verified email address.";
      case "oauth_authentication_failed":
        return "Google sign-in failed. Please try again.";
      default:
        return "An error occurred during authentication.";
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  if (checking) {
    return (
      <div className="flex items-center gap-3 text-sm text-[#5C5C57]">
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 12a8 8 0 018-8v8H4z"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
        Checking session...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px]">
      <Link
        href="/"
        className="mb-12 inline-flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.03em]"
      >
        <span className="h-3 w-3 rounded-full bg-[#2F4BFF]" />
        recruiter
      </Link>

      <p className="font-mono text-[13px] tracking-[0.04em] text-[#5C5C57]">
        Recruiter portal
      </p>
      <h1 className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
        Sign in to manage your hiring.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-[#5C5C57]">
        Use your Google account to manage recruitment pipelines.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-8 flex items-start gap-3 rounded-2xl border border-[#F2C4BF] bg-[#FCE9E7] p-4 text-sm text-[#A8281E]"
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
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{getErrorMessage(error)}</span>
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        type="button"
        className="mt-8 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#101010] px-6 text-base font-medium text-[#F6F6F3] transition-opacity hover:opacity-85"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
        </span>
        Continue with Google
      </button>

      <div className="mt-10 border-t border-[#D9D9D2] pt-6">
        <p className="text-sm leading-relaxed text-[#5C5C57]">
          Are you a candidate? Access your application status via the private
          tracking link sent to your email, or{" "}
          <Link
            href="/track"
            className="font-medium text-[#101010] underline underline-offset-4 decoration-[#CFCFC8] transition-colors hover:decoration-[#101010]"
          >
            track your application
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F6F3] px-6 py-16 font-sans text-[#101010] selection:bg-[#2F4BFF] selection:text-white">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 text-sm text-[#5C5C57]">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 12a8 8 0 018-8v8H4z"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
