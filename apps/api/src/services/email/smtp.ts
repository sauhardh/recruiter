import nodemailer, { type Transporter } from "nodemailer";
import type {
  EmailProvider,
  EmailSendResult,
  SendEmailOptions,
} from "./types.js";

export class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || "";

    if (!this.defaultFrom) {
      console.error(
        "[Email Configuration] EMAIL_FROM is missing in .env! Emails cannot be dispatched until set.",
      );
    }

    const host = process.env.SMTP_HOST || "localhost";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    if (!this.defaultFrom) {
      const error =
        "EMAIL_FROM is not defined in .env. Please define EMAIL_FROM to send emails.";
      console.error(`[SmtpEmailProvider]  ${error}`);
      return {
        success: false,
        error,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error sending email";
      console.error("[SmtpEmailProvider] Error sending email:", errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
