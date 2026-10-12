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
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Position not found" });
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

    res.json({ position });
  } catch (error) {
    console.error("Error storing positions of that ID:", error);
    res.status(500).json({ error: "Failed to store positions" });
  }
}

export { storePositions, updatePosition };
