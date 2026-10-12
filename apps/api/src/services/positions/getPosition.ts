import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

async function getPositions(req: Request, res: Response) {
  const user = req.user;

  try {
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let positions = await prisma.position.findMany({
      where: {
        creatorId: user.userId,
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const stats = {
      totalPositions: positions.length,
      openPositions: positions.filter((p) => p.status === "OPEN").length,
      totalApplications: positions.reduce(
        (sum, p) => sum + (p._count?.applications ?? 0),
        0,
      ),
    };

    res.json({ positions, stats });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
}

async function getPostion(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Bad request with that ID" });
      return;
    }

    let position = await prisma.position.findFirst({
      where: { id: id.toString(), creatorId: user.userId },
      include: {
        applications: {
          include: {
            candidate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        rounds: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!position) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    res.json({ position });
  } catch (error) {
    console.error("Error fetching positions of particular id:", error);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
}

export { getPositions, getPostion };
