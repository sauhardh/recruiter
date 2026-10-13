import type { Request, Response } from "express";
import { createHash } from "crypto";
import { prisma } from "../../lib/prisma.js";

const DEFAULT_ROUNDS = [
  {
    title: "Application Screening",
    type: "FORM" as const,
    order: 1,
    instructions: "Initial review of candidate responses, background, and submitted resume.",
  },
  {
    title: "Written Test / Quiz",
    type: "TEST" as const,
    order: 2,
    instructions: "Evaluation of core concepts and domain expertise.",
  },
  {
    title: "Practical Assessment",
    type: "ASSESSMENT" as const,
    order: 3,
    instructions: "Project or code assessment to evaluate hands-on problem-solving skills.",
  },
  {
    title: "Final Interview",
    type: "INTERVIEW" as const,
    order: 4,
    instructions: "Live discussion and technical interview with the hiring team.",
  },
];

export async function getTrackingApplication(req: Request, res: Response) {
  try {
    const rawToken = req.params.token;
    if (!rawToken || typeof rawToken !== "string") {
      res.status(400).json({ error: "Tracking token is required" });
      return;
    }

    const tokenHash = createHash("sha256").update(rawToken.trim()).digest("hex");

    const application = await prisma.application.findUnique({
      where: { trackingTokenHash: tokenHash },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            rounds: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
                instructions: true,
                externalUrl: true,
                publishedAt: true,
                isRequired: true,
                config: true,
              },
            },
          },
        },
        roundResults: {
          select: {
            id: true,
            roundId: true,
            status: true,
            score: true,
            isPublished: true,
            publishedAt: true,
            scheduledAt: true,
            endsAt: true,
            timeZone: true,
            meetingUrl: true,
            decisionAt: true,
            completedAt: true,
            submissionData: true,
            customConfig: true,
            // Recruiter internal notes are strictly omitted for candidate privacy
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found. Please check your tracking link." });
      return;
    }

    // If the position has no rounds configured yet, seed the default rounds
    let rounds = application.position.rounds;
    if (rounds.length === 0) {
      await prisma.hiringRound.createMany({
        data: DEFAULT_ROUNDS.map((r) => ({
          positionId: application.position.id,
          ...r,
        })),
        skipDuplicates: true,
      });

      rounds = await prisma.hiringRound.findMany({
        where: { positionId: application.position.id },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          order: true,
          instructions: true,
          externalUrl: true,
          publishedAt: true,
          isRequired: true,
          config: true,
        },
      });
    }

    // Sanitize rounds strictly PER CANDIDATE:
    // Only expose details (dates, venue, map, syllabus, brief) if published specifically for this candidate!
    const sanitizedRounds = rounds.map((round) => {
      const candidateResult = application.roundResults.find(
        (r) => r.roundId === round.id,
      );
      const isCandidatePublished = Boolean(candidateResult?.isPublished);

      if (!isCandidatePublished) {
        // Do NOT leak details of unpublished or upcoming stages
        return {
          id: round.id,
          title: round.title,
          type: round.type,
          order: round.order,
          instructions: null,
          externalUrl: null,
          publishedAt: null,
          isRequired: round.isRequired,
          config: null,
        };
      }

      const baseConfig = (round.config && typeof round.config === "object"
        ? (round.config as Record<string, unknown>)
        : {}) as Record<string, unknown>;

      const customConfig = (candidateResult?.customConfig &&
      typeof candidateResult.customConfig === "object"
        ? (candidateResult.customConfig as Record<string, unknown>)
        : {}) as Record<string, unknown>;

      const candidateEffectiveConfig = {
        location: (customConfig.location ?? baseConfig.location ?? null) as string | null,
        mapUrl: (customConfig.mapUrl ?? baseConfig.mapUrl ?? round.externalUrl ?? null) as string | null,
        syllabus: (customConfig.syllabus ?? baseConfig.syllabus ?? round.instructions ?? null) as string | null,
        description: (customConfig.description ?? baseConfig.description ?? round.instructions ?? null) as string | null,
        testDate: candidateResult?.scheduledAt
          ? candidateResult.scheduledAt.toISOString()
          : ((customConfig.testDate ?? baseConfig.testDate ?? null) as string | null),
        meetingDate: candidateResult?.scheduledAt
          ? candidateResult.scheduledAt.toISOString()
          : ((customConfig.meetingDate ?? baseConfig.meetingDate ?? null) as string | null),
        meetingUrl: candidateResult?.meetingUrl ?? (customConfig.meetingUrl as string | null) ?? (baseConfig.meetingUrl as string | null) ?? null,
        isPublished: true,
      };

      return {
        ...round,
        config: candidateEffectiveConfig,
      };
    });

    // Sanitize round results: only expose score if explicitly published
    const sanitizedRoundResults = application.roundResults.map((result) => ({
      ...result,
      score: result.isPublished ? result.score : null,
      customConfig: result.isPublished ? result.customConfig : null,
    }));

    res.json({
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
        candidate: application.candidate,
        position: {
          ...application.position,
          rounds: sanitizedRounds,
        },
        roundResults: sanitizedRoundResults,
      },
    });
  } catch (error) {
    console.error("Error fetching tracking application:", error);
    res.status(500).json({ error: "Failed to load application status" });
  }
}
