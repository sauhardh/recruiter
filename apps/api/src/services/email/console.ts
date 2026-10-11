import type {
  EmailProvider,
  EmailSendResult,
  SendEmailOptions,
} from "./types.js";

export class ConsoleEmailProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    const recipients = Array.isArray(options.to)
      ? options.to.join(", ")
      : options.to;
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    console.log("--------------------------------------------------");
    console.log(`[ConsoleEmailProvider] Email Dispatched`);
    console.log(`To: ${recipients}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message ID: ${messageId}`);

    if (options.text) {
      console.log(`Body (Text):\n${options.text}`);
    } else {
      console.log(`Body (HTML):\n${options.html}`);
    }

    console.log("--------------------------------------------------");

    return {
      success: true,
      messageId,
    };
  }
}
