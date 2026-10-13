import { apiFetch } from "./api";
import type { Candidate } from "./types";

export async function getCandidates(): Promise<{ candidates: Candidate[] }> {
  return apiFetch<{ candidates: Candidate[] }>("/api/candidates");
}

export async function getCandidateById(
  id: string,
): Promise<{ candidate: Candidate }> {
  return apiFetch<{ candidate: Candidate }>(`/api/candidates/${id}`);
}
