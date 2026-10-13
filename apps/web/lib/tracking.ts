import { API_BASE_URL } from "./api";

export interface TrackingRound {
  id: string;
  title: string;
  type: "FORM" | "TEST" | "ASSESSMENT" | "INTERVIEW" | "MANUAL";
  order: number;
  instructions?: string | null;
  externalUrl?: string | null;
  config?: {
    testDate?: string | null;
    location?: string | null;
    mapUrl?: string | null;
    syllabus?: string | null;
    description?: string | null;
    meetingDate?: string | null;
    meetingUrl?: string | null;
    isPublished?: boolean;
    publishedAt?: string | null;
  } | null;
  publishedAt?: string | null;
  isRequired: boolean;
}

export interface TrackingRoundResult {
  id: string;
  roundId: string;
  status: "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED" | "SKIPPED";
  score?: number | null;
  isPublished: boolean;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  endsAt?: string | null;
  timeZone?: string | null;
  meetingUrl?: string | null;
  completedAt?: string | null;
  submissionData?: {
    githubUrl?: string | null;
    otherUrl?: string | null;
    submittedAt?: string | null;
  } | null;
}

export interface TrackingApplication {
  id: string;
  status: "ACTIVE" | "HIRED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  position: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    rounds: TrackingRound[];
  };
  roundResults: TrackingRoundResult[];
}

export async function getTrackingApplication(
  token: string,
): Promise<{ application: TrackingApplication }> {
  const res = await fetch(`${API_BASE_URL}/api/track/${token}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to load application status");
  }
  return data;
}

export async function submitAssessmentLinks(
  token: string,
  roundId: string,
  payload: { githubUrl?: string | null; otherUrl?: string | null },
): Promise<{
  message: string;
  participation?: {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED" | "SKIPPED";
    submissionData: {
      githubUrl?: string | null;
      otherUrl?: string | null;
      submittedAt?: string | null;
    };
  };
}> {
  const res = await fetch(
    `${API_BASE_URL}/api/track/${token}/rounds/${roundId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Submission failed");
  }
  return data;
}
