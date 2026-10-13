import { apiFetch } from "./api";
import type {
  Position,
  DashboardStats,
  HiringRound,
  Application,
} from "./types";

export interface CreatePositionPayload {
  title: string;
  status: Position["status"];
  description?: string;
  announcementSubject?: string;
  announcementBody?: string;
}

export interface UpdatePositionPayload {
  status?: Position["status"];
  title?: string;
  description?: string;
}

export interface AnnouncePositionPayload {
  to: string[];
  subject: string;
  body: string;
}

export interface UpdateRoundPayload {
  testDate?: string | null;
  location?: string | null;
  mapUrl?: string | null;
  syllabus?: string | null;
  description?: string | null;
  meetingDate?: string | null;
  meetingUrl?: string | null;
  isPublished?: boolean;
}

export async function getPositions(): Promise<{
  positions: Position[];
  stats?: DashboardStats;
}> {
  return apiFetch<{ positions: Position[]; stats: DashboardStats }>(
    "/api/positions",
  );
}

export async function getPositionById(
  id: string,
): Promise<{ position: Position }> {
  return apiFetch<{ position: Position }>(`/api/positions/${id}`);
}

export async function createPosition(
  payload: CreatePositionPayload,
): Promise<{ position: Position }> {
  return apiFetch<{ position: Position }>("/api/positions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePosition(
  id: string,
  payload: UpdatePositionPayload,
): Promise<{ position: Position }> {
  return apiFetch<{ position: Position }>(`/api/positions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function announcePosition(
  id: string,
  payload: AnnouncePositionPayload,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/positions/${id}/announce`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRound(
  positionId: string,
  roundId: string,
  payload: UpdateRoundPayload,
): Promise<{ round: HiringRound; message: string }> {
  return apiFetch<{ round: HiringRound; message: string }>(
    `/api/positions/${positionId}/rounds/${roundId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function evaluateCandidate(
  applicationId: string,
  decision: "PASS" | "FAIL",
): Promise<{ message: string; application: Application }> {
  return apiFetch<{ message: string; application: Application }>(
    `/api/applications/${applicationId}/evaluate`,
    {
      method: "POST",
      body: JSON.stringify({ decision }),
    },
  );
}
