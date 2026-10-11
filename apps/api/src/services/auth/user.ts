import { prisma } from "../../lib/prisma.js";
import { getGoogleProfile } from "./google.js";

export async function signInWithGoogle(code: string) {
  const profile = await getGoogleProfile(code);

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

export async function getUserById(id: string) {
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
