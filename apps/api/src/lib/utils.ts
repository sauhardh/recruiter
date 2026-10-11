export const COOKIE_NAME = "recruiter_id";
export const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day

export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    maxAge: COOKIE_MAX_AGE,
  };
}
