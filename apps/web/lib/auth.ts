import { apiFetch, API_BASE_URL } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "RECRUITER" | "ADMIN";
  avatarUrl?: string | null;
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/api/auth/me");
}

export async function logoutUser(): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to log out");
  }
  return res.json();
}
