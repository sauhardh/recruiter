export function getGoogleOAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth credentials are not configured in environment variables",
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    prompt: "consent",
    access_type: "offline",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getGoogleProfile(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth credentials are not configured in environment variables",
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokenData: unknown = await tokenResponse.json();

  if (
    typeof tokenData !== "object" ||
    tokenData === null ||
    !("access_token" in tokenData) ||
    typeof tokenData.access_token !== "string"
  ) {
    throw new Error("Invalid Google token response: missing access_token");
  }

  const profileResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );

  if (!profileResponse.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  const profile: unknown = await profileResponse.json();

  if (
    typeof profile !== "object" ||
    profile === null ||
    !("email" in profile) ||
    typeof profile.email !== "string" ||
    !profile.email.trim() ||
    !("verified_email" in profile) ||
    profile.verified_email !== true
  ) {
    throw new Error("Google did not provide a verified email");
  }

  return {
    email: profile.email.trim().toLowerCase(),
    name:
      "name" in profile && typeof profile.name === "string"
        ? profile.name
        : profile.email,
    avatarUrl:
      "picture" in profile && typeof profile.picture === "string"
        ? profile.picture
        : null,
  };
}
