import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export async function updateRound(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const positionId = String(req.params.positionId);
    const roundId = String(req.params.roundId);

    if (!positionId || !roundId) {
      res.status(400).json({ error: "Position ID and Round ID are required" });
      return;
    }

    // Verify position belongs to recruiter
    const position = await prisma.position.findFirst({
      where: {
        id: positionId,
        creatorId: String(user.userId),
      },
      select: { id: true },
    });

    if (!position) {
      res.status(404).json({ error: "Position not found or unauthorized" });
      return;
    }

    // Verify round belongs to this position
    const round = await prisma.hiringRound.findFirst({
      where: {
        id: roundId,
        positionId,
      },
    });

    if (!round) {
      res.status(404).json({ error: "Round not found for this position" });
      return;
    }

    const {
      testDate,
      location,
      mapUrl,
      syllabus,
      description,
      meetingDate,
      meetingUrl,
      isPublished,
      instructions,
      title,
    } = req.body as {
      testDate?: string | null;
      location?: string | null;
      mapUrl?: string | null;
      syllabus?: string | null;
      description?: string | null;
      meetingDate?: string | null;
      meetingUrl?: string | null;
      isPublished?: boolean;
      instructions?: string | null;
      title?: string;
    };

    const existingConfig = (round.config && typeof round.config === "object"
      ? round.config
      : {}) as Record<string, unknown>;

    const updatedConfig: Record<string, unknown> = {
      ...existingConfig,
      ...(testDate !== undefined ? { testDate } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(mapUrl !== undefined ? { mapUrl } : {}),
      ...(syllabus !== undefined ? { syllabus } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(meetingDate !== undefined ? { meetingDate } : {}),
      ...(meetingUrl !== undefined ? { meetingUrl } : {}),
      ...(isPublished !== undefined ? { isPublished } : {}),
    };

    if (isPublished) {
      updatedConfig.publishedAt = new Date().toISOString();
    } else if (isPublished === false) {
      updatedConfig.publishedAt = null;
    }

    const updated = await prisma.hiringRound.update({
      where: { id: roundId },
      data: {
        config: updatedConfig as any,
        ...(isPublished !== undefined
          ? { publishedAt: isPublished ? new Date() : null }
          : {}),
        ...(mapUrl !== undefined ? { externalUrl: mapUrl } : {}),
        ...(instructions !== undefined ? { instructions } : {}),
        ...(title !== undefined ? { title: title.trim() } : {}),
      },
    });

    res.json({
      round: updated,
      message: "Round updated successfully",
    });
  } catch (error) {
    console.error("Error updating round:", error);
    res.status(500).json({ error: "Failed to update round" });
  }
}
