import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export async function scheduleCandidateRound(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const applicationId = String(req.params.applicationId);
    const roundId = String(req.params.roundId);

    if (!applicationId || !roundId) {
      res.status(400).json({ error: "Application ID and Round ID are required" });
      return;
    }

    // Verify application belongs to a position created by this recruiter
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        position: {
          creatorId: String(user.userId),
        },
      },
      include: {
        position: {
          include: {
            rounds: true,
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found or unauthorized" });
      return;
    }

    // Verify round belongs to this position
    const round = application.position.rounds.find((r) => r.id === roundId);
    if (!round) {
      res.status(404).json({ error: "Round not found for this position" });
      return;
    }

    const {
      scheduledAt,
      meetingUrl,
      timeZone,
      customConfig,
      isPublished,
      notes,
    } = req.body as {
      scheduledAt?: string | null;
      meetingUrl?: string | null;
      timeZone?: string | null;
      customConfig?: Record<string, unknown> | null;
      isPublished?: boolean;
      notes?: string | null;
    };

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }
    if (meetingUrl !== undefined) {
      updateData.meetingUrl = meetingUrl ? meetingUrl.trim() : null;
    }
    if (timeZone !== undefined) {
      updateData.timeZone = timeZone ? timeZone.trim() : null;
    }
    if (customConfig !== undefined) {
      updateData.customConfig = customConfig;
    }
    if (notes !== undefined) {
      updateData.recruiterNotes = notes;
    }
    if (isPublished !== undefined) {
      updateData.isPublished = Boolean(isPublished);
      updateData.publishedAt = isPublished ? new Date() : null;
    }

    const participation = await prisma.roundParticipation.upsert({
      where: {
        applicationId_roundId: {
          applicationId,
          roundId,
        },
      },
      create: {
        applicationId,
        roundId,
        status: "PENDING",
        ...updateData,
      },
      update: updateData,
      include: {
        round: true,
      },
    });

    // Return the updated application with all round results
    const updatedApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        roundResults: {
          include: { round: true },
          orderBy: { round: { order: "asc" } },
        },
      },
    });

    res.json({
      message: isPublished
        ? "Round schedule published to candidate"
        : "Candidate round schedule updated",
      participation,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error scheduling candidate round:", error);
    res.status(500).json({ error: "Failed to update candidate schedule" });
  }
}
