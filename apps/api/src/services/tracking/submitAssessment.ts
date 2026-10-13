import type { Request, Response } from "express";
import { createHash } from "crypto";
import { prisma } from "../../lib/prisma.js";

export async function submitAssessment(req: Request, res: Response) {
  try {
    const rawToken = req.params.token;
    const roundId = String(req.params.roundId);

    if (!rawToken || typeof rawToken !== "string") {
      res.status(400).json({ error: "Tracking token is required" });
      return;
    }
    if (!roundId) {
      res.status(400).json({ error: "Round ID is required" });
      return;
    }

    const tokenHash = createHash("sha256").update(rawToken.trim()).digest("hex");

    const application = await prisma.application.findUnique({
      where: { trackingTokenHash: tokenHash },
      select: { id: true, status: true },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    if (application.status === "REJECTED" || application.status === "WITHDRAWN") {
      res.status(400).json({ error: "Application is no longer active" });
      return;
    }

    const { githubUrl, otherUrl } = req.body as {
      githubUrl?: string;
      otherUrl?: string;
    };

    // Upsert RoundParticipation with submission data
    const participation = await prisma.roundParticipation.upsert({
      where: {
        applicationId_roundId: {
          applicationId: application.id,
          roundId,
        },
      },
      update: {
        submissionData: {
          githubUrl: githubUrl?.trim() || null,
          otherUrl: otherUrl?.trim() || null,
          submittedAt: new Date().toISOString(),
        } as any,
        status: "IN_PROGRESS",
      },
      create: {
        applicationId: application.id,
        roundId,
        status: "IN_PROGRESS",
        submissionData: {
          githubUrl: githubUrl?.trim() || null,
          otherUrl: otherUrl?.trim() || null,
          submittedAt: new Date().toISOString(),
        } as any,
      },
    });

    res.json({
      message: "Assessment submitted successfully",
      participation: {
        id: participation.id,
        status: participation.status,
        submissionData: participation.submissionData,
      },
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({ error: "Failed to submit assessment" });
  }
}
