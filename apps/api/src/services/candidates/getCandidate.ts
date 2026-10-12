import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

async function getCandidates(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        applications: {
          some: {
            position: {
              creatorId: user.userId,
            },
          },
        },
      },
      include: {
        applications: {
          where: {
            position: {
              creatorId: user.userId,
            },
          },
          include: {
            position: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ candidates });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
}

async function getCandidate(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Invalid candidate ID" });
      return;
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        applications: {
          some: {
            position: {
              creatorId: user.userId,
            },
          },
        },
      },
      include: {
        applications: {
          where: {
            position: {
              creatorId: user.userId,
            },
          },
          include: {
            position: {
              select: {
                id: true,
                title: true,
              },
            },
            roundResults: {
              include: {
                round: {
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    order: true,
                  },
                },
              },
              orderBy: {
                round: {
                  order: "asc",
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    res.json({ candidate });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    res.status(500).json({ error: "Failed to fetch candidate" });
  }
}

export { getCandidates, getCandidate };
