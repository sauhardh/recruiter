import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export async function evaluateCandidate(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const applicationId = String(req.params.applicationId);
    if (!applicationId) {
      res.status(400).json({ error: "Application ID is required" });
      return;
    }

    const { decision, notes, score } = req.body as {
      decision?: "PASS" | "FAIL";
      notes?: string;
      score?: number;
    };

    if (decision !== "PASS" && decision !== "FAIL") {
      res.status(400).json({ error: "Decision must be 'PASS' or 'FAIL'" });
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
            rounds: {
              orderBy: { order: "asc" },
            },
          },
        },
        roundResults: {
          include: {
            round: true,
          },
          orderBy: {
            round: { order: "asc" },
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found or unauthorized" });
      return;
    }

    const rounds = application.position.rounds;
    if (rounds.length === 0) {
      res.status(400).json({ error: "Position does not have any hiring rounds configured" });
      return;
    }

    // Find the current active round to evaluate:
    // 1. Look for any roundResult with status PENDING or IN_PROGRESS
    let currentResult = application.roundResults.find(
      (r) => r.status === "PENDING" || r.status === "IN_PROGRESS"
    );

    // 2. If none is PENDING/IN_PROGRESS, find the first round not yet PASSED or FAILED
    if (!currentResult) {
      const passedRoundIds = new Set(
        application.roundResults.filter((r) => r.status === "PASSED").map((r) => r.roundId)
      );
      const activeRound = rounds.find((r) => !passedRoundIds.has(r.id));
      if (activeRound) {
        currentResult = await prisma.roundParticipation.upsert({
          where: {
            applicationId_roundId: {
              applicationId: application.id,
              roundId: activeRound.id,
            },
          },
          create: {
            applicationId: application.id,
            roundId: activeRound.id,
            status: "PENDING",
          },
          update: {},
          include: { round: true },
        });
      } else {
        res.status(400).json({ error: "Candidate has already completed all evaluation rounds" });
        return;
      }
    }

    const currentRound = currentResult.round;

    if (decision === "PASS") {
      // 1. Mark current round as PASSED
      await prisma.roundParticipation.update({
        where: { id: currentResult.id },
        data: {
          status: "PASSED",
          score: typeof score === "number" ? score : currentResult.score,
          recruiterNotes: notes !== undefined ? notes : currentResult.recruiterNotes,
          decisionAt: new Date(),
          completedAt: new Date(),
          isPublished: true,
        },
      });

      // 2. Look for the next round (order > currentRound.order)
      const nextRound = rounds.find((r) => r.order > currentRound.order);

      if (nextRound) {
        // Candidate moves to the next round!
        await prisma.roundParticipation.upsert({
          where: {
            applicationId_roundId: {
              applicationId: application.id,
              roundId: nextRound.id,
            },
          },
          create: {
            applicationId: application.id,
            roundId: nextRound.id,
            status: "PENDING",
          },
          update: {
            status: "PENDING",
          },
        });

        // Ensure application stays ACTIVE
        await prisma.application.update({
          where: { id: application.id },
          data: { status: "ACTIVE" },
        });
      } else {
        // Final round cleared — candidate is HIRED!
        await prisma.application.update({
          where: { id: application.id },
          data: { status: "HIRED" },
        });
      }
    } else {
      // decision === "FAIL"
      // 1. Mark current round as FAILED
      await prisma.roundParticipation.update({
        where: { id: currentResult.id },
        data: {
          status: "FAILED",
          score: typeof score === "number" ? score : currentResult.score,
          recruiterNotes: notes !== undefined ? notes : currentResult.recruiterNotes,
          decisionAt: new Date(),
          completedAt: new Date(),
          isPublished: true,
        },
      });

      // 2. Mark application as REJECTED
      await prisma.application.update({
        where: { id: application.id },
        data: { status: "REJECTED" },
      });
    }

    // Return the updated application with candidate and all round results
    const updatedApplication = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        candidate: true,
        roundResults: {
          include: { round: true },
          orderBy: { round: { order: "asc" } },
        },
      },
    });

    res.json({
      message: decision === "PASS" ? "Candidate passed to next stage" : "Candidate rejected",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error evaluating candidate:", error);
    res.status(500).json({ error: "Failed to evaluate candidate" });
  }
}
