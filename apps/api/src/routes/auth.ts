import type { Request, Response } from "express";
import { getGoogleOAuthUrl } from "../services/auth/google.js";
import { signInWithGoogle, getUserById } from "../services/auth/user.js";
import { COOKIE_NAME, getCookieOptions } from "../lib/utils.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export function initiateGoogleAuth(req: Request, res: Response): void {
  try {
    const url = getGoogleOAuthUrl();
    res.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to initiate Google OAuth";
    console.error(" Google OAuth initiation error:", message);
    res.status(500).json({ error: message });
  }
}

export async function handleGoogleCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const code = req.query.code as string | undefined;

  if (!code) {
    res.redirect(`${FRONTEND_URL}/login?error=missing_auth_code`);
    return;
  }

  try {
    const user = await signInWithGoogle(code);

    // Set simple HTTP-only cookie with user id
    res.cookie(COOKIE_NAME, user.id, getCookieOptions());

    // Redirect directly to frontend dashboard with userId param
    res.redirect(`${FRONTEND_URL}/recruiter/dashboard?userId=${user.id}`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Google OAuth authentication failed";
    console.error(" Google OAuth callback error:", message);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_authentication_failed`);
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error(" Error fetching current user:", error);
    res.status(500).json({ error: "Failed to fetch user session" });
  }
}

export function logoutUser(req: Request, res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.json({ success: true, message: "Logged out successfully" });
}
