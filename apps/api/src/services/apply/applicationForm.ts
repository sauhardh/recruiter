import type { Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import path from "path";
import { prisma } from "../../lib/prisma.js";

// GET /api/apply/:positionId — public, returns position info for the form page
async function getApplicationForm(req: Request, res: Response) {
  try {
    const positionId = String(req.params.positionId);

    const position = await prisma.position.findFirst({
      where: { id: positionId },
      select: { id: true, title: true, description: true, status: true },
    });

    if (!position) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    res.json({ position });
  } catch (error) {
    console.error("Error fetching application form:", error);
    res.status(500).json({ error: "Failed to load form" });
  }
}

// POST /api/apply/:positionId — public, handles form submission with optional resume upload
async function submitApplication(req: Request, res: Response) {
  try {
    const positionId = String(req.params.positionId);

    // Verify position exists and is OPEN
    const position = await prisma.position.findFirst({
      where: { id: positionId },
      select: { id: true, status: true, title: true },
    });

    if (!position) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    if (position.status !== "OPEN") {
      res
        .status(400)
        .json({ error: "Applications for this position are currently closed" });
      return;
    }

    // Validate required fields
    const { name, email, phone, description } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      description?: string;
    };

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();

    // Dedup: check if this email already has an application for this position
    const existingApplication = await prisma.application.findFirst({
      where: {
        positionId,
        candidate: { email: normalizedEmail },
      },
      select: { id: true },
    });

    if (existingApplication) {
      res.status(409).json({
        error:
          "You have already applied to this position. Each candidate can apply once.",
      });
      return;
    }

    // Handle resume file upload (optional)
    const file = (req as Request & { file?: Express.Multer.File }).file;
    let resumeUrl: string | null = null;

    if (file) {
      // Build a safe filename: timestamp + original name (sanitised)
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
      const uploadPath = path.join(process.cwd(), "uploads", safeName);

      // Write buffer to disk
      const { writeFile } = await import("fs/promises");
      await writeFile(uploadPath, file.buffer);

      // URL accessible via static file serving: /uploads/<safeName>
      resumeUrl = `/uploads/${safeName}`;
    }

    // Upsert candidate by email (never overwrite existing profile data)
    const candidate = await prisma.candidate.upsert({
      where: { email: normalizedEmail },
      create: {
        name: normalizedName,
        email: normalizedEmail,
        phone: phone?.trim() || null,
      },
      update: {},
    });

    // Generate cryptographically secure tracking token
    const trackingToken = randomBytes(32).toString("hex");
    const trackingTokenHash = createHash("sha256")
      .update(trackingToken)
      .digest("hex");

    // Ensure position has rounds configured, seed defaults if empty
    let rounds = await prisma.hiringRound.findMany({
      where: { positionId },
      orderBy: { order: "asc" },
    });

    if (rounds.length === 0) {
      const defaultRounds = [
        {
          title: "Application Screening",
          type: "FORM" as const,
          order: 1,
          instructions:
            "Initial review of candidate responses, background, and submitted resume.",
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
          instructions:
            "Project or code assessment to evaluate hands-on problem-solving skills.",
        },
        {
          title: "Final Interview",
          type: "INTERVIEW" as const,
          order: 4,
          instructions:
            "Live discussion and technical interview with the hiring team.",
        },
      ];

      await prisma.hiringRound.createMany({
        data: defaultRounds.map((r) => ({ positionId, ...r })),
        skipDuplicates: true,
      });

      rounds = await prisma.hiringRound.findMany({
        where: { positionId },
        orderBy: { order: "asc" },
      });
    }

    const firstRound = rounds[0];

    const applicationData: {
      positionId: string;
      candidateId: string;
      trackingTokenHash: string;
      source: string;
      resumeUrl: string | null;
      rawAnswers: object;
      roundResults?: {
        create: {
          roundId: string;
          status: "PENDING";
        }[];
      };
    } = {
      positionId,
      candidateId: candidate.id,
      trackingTokenHash,
      source: "DIRECT_FORM",
      resumeUrl,
      rawAnswers: {
        name: normalizedName,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        description: description?.trim() || null,
      },
    };

    if (firstRound) {
      applicationData.roundResults = {
        create: [
          {
            roundId: firstRound.id,
            status: "PENDING",
          },
        ],
      };
    }

    // Create the application record and initial round participation (PENDING review)
    await prisma.application.create({
      data: applicationData,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      trackingToken,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ error: "Failed to submit application" });
  }
}

export { getApplicationForm, submitApplication };
