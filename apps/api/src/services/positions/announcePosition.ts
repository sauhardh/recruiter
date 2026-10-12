import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { getEmailProvider } from "../email/index.js";

async function announcePosition(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const positionId = String(req.params.id);

    // Verify position belongs to this recruiter
    const position = await prisma.position.findFirst({
      where: { id: positionId, creatorId: String(user.userId) },
      select: { id: true, title: true },
    });

    if (!position) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    const { to, subject, body } = req.body as {
      to?: string | string[];
      subject?: string;
      body?: string;
    };

    if (!to || (Array.isArray(to) ? to.length === 0 : !to.trim())) {
      res
        .status(400)
        .json({ error: "At least one recipient email is required" });
      return;
    }
    if (!subject || !subject.trim()) {
      res.status(400).json({ error: "Email subject is required" });
      return;
    }
    if (!body || !body.trim()) {
      res.status(400).json({ error: "Email body is required" });
      return;
    }

    // Normalise recipients — frontend can send a comma-separated string or array
    const recipients: string[] = Array.isArray(to)
      ? to.map((e) => e.trim()).filter(Boolean)
      : to
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);

    const emailProvider = getEmailProvider();

    const result = await emailProvider.send({
      to: recipients,
      subject: subject.trim(),
      html: body.trim().replace(/\n/g, "<br>"),
      text: body.trim(),
    });

    if (!result.success) {
      res
        .status(500)
        .json({ error: "Failed to send email", detail: result.error });
      return;
    }

    res.json({
      message: "Announcement sent",
      messageId: result.messageId,
      recipients,
    });
  } catch (error) {
    console.error("Error announcing position:", error);
    res.status(500).json({ error: "Failed to send announcement" });
  }
}

export { announcePosition };
