import { prisma } from "../../lib/prisma.js";

export interface GoogleProfile {
  email: string;
  name: string;
  avatarUrl: string | null;
}

export class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || "";
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    this.callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:5000/api/auth/google/callback";
  }

  private validateConfig(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        "Google OAuth credentials are not configured in environment variables",
      );
    }
  }

  getAuthorizationUrl(): string {
    this.validateConfig();

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      prompt: "consent",
      access_type: "offline",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async fetchProfile(code: string): Promise<GoogleProfile> {
    this.validateConfig();

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
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

  async authenticate(code: string) {
    const profile = await this.fetchProfile(code);

    return prisma.user.upsert({
      where: { email: profile.email },
      update: {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      create: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        role: "RECRUITER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }
}

export const googleOAuthService = new GoogleOAuthService();
