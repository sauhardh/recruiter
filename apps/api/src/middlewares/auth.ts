import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { COOKIE_NAME } from "../lib/utils.js";

export interface AuthUser {
  userId: string;
  email: string;
  role: "RECRUITER" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId =
    req.cookies?.[COOKIE_NAME] ||
    req.headers["x-user-id"] ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!userId || typeof userId !== "string") {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid user or unauthenticated" });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}
