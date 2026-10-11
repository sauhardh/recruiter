import type { EmailProvider } from "./types.js";
import { ConsoleEmailProvider } from "./console.js";
import { SmtpEmailProvider } from "./smtp.js";

export * from "./types.js";
export * from "./console.js";
export * from "./smtp.js";

let emailProviderInstance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (emailProviderInstance) {
    return emailProviderInstance;
  }

  const shouldUseSmtp =
    process.env.EMAIL_PROVIDER === "smtp" ||
    (process.env.NODE_ENV === "production" && !!process.env.SMTP_HOST);

  if (shouldUseSmtp) {
    emailProviderInstance = new SmtpEmailProvider();
  } else {
    emailProviderInstance = new ConsoleEmailProvider();
  }

  return emailProviderInstance;
}
