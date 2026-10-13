import { API_BASE_URL } from "./api";
import type { Position } from "./types";

export interface ApplicationFormDetails {
  position: Position;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SubmitApplicationResponse {
  message: string;
  trackingToken: string;
  applicationId: string;
}

export async function getApplicationForm(
  positionId: string,
): Promise<ApplicationFormDetails> {
  const res = await fetch(`${API_BASE_URL}/api/apply/${positionId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to load application form");
  }
  return data;
}

export async function submitApplicationForm(
  positionId: string,
  formData: FormData,
): Promise<SubmitApplicationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/apply/${positionId}`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit application");
  }
  return data;
}
