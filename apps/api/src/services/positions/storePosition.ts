import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

async function storePositions(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const payload = req.body;

    const defaultRounds = [
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

    let positions = await prisma.position.create({
      data: {
        title: payload.title.trim(),
        status: payload.status,
        description: payload.description,
        announcementSubject: payload.announcementSubject,
        announcementBody: payload.announcementBody,
        creator: {
          connect: {
            id: user.userId,
          },
        },
        rounds: {
          create: defaultRounds,
        },
      },
    });

    res.status(201).json({ position: positions });
  } catch (error) {
    console.error("Error storing positions:", error);
    res.status(500).json({ error: "Failed to store positions" });
  }
}

async function updatePosition(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { status, title, description } = req.body;

    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid position ID" });
      return;
    }

    const existing = await prisma.position.findFirst({
      where: {
        id,
        creatorId: user.userId,
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    if (existing.status === "CLOSED" && status && status !== "CLOSED") {
      res.status(400).json({ error: "Closed positions cannot be reopened. Please create a new position instead." });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;

    const position = await prisma.position.update({
      where: { id },
      data: updateData,
    });

    // When a position is closed, close all remaining ACTIVE applications as REJECTED
    if (status === "CLOSED") {
      await prisma.application.updateMany({
        where: {
          positionId: id,
          status: "ACTIVE",
        },
        data: {
          status: "REJECTED",
        },
      });
    }

    res.json({ position });
  } catch (error) {
    console.error("Error storing positions of that ID:", error);
    res.status(500).json({ error: "Failed to store positions" });
  }
}

export { storePositions, updatePosition };
