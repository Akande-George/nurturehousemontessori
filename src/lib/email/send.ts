import "server-only";
import type { ReactElement } from "react";
import { resend, EMAIL_FROM, EMAIL_REPLY_TO, isEmailConfigured } from "./client";

export type SendHtmlInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Best-effort HTML send (same never-throw contract as sendEmail). Logs to the
 * console when Resend isn't configured so local dev / unverified-domain works.
 */
export async function sendHtmlEmail({
  to,
  subject,
  html,
  replyTo,
}: SendHtmlInput): Promise<SendResult> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return { ok: true, skipped: true };
  if (!isEmailConfigured || !resend) {
    console.info(
      `[email:console] (no RESEND_API_KEY) → to=${recipients.join(", ")} subject="${subject}"`,
    );
    return { ok: true, skipped: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject,
      html,
      replyTo: replyTo ?? EMAIL_REPLY_TO,
    });
    if (error) {
      console.error(`[email] send failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] send threw: ${message}`);
    return { ok: false, error: message };
  }
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Best-effort transactional send. Never throws — email is a side effect that
 * must not fail the surrounding mutation. When Resend isn't configured it logs
 * to the server console (so local dev + previews work without a key).
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: SendEmailInput): Promise<SendResult> {
  const recipients = Array.isArray(to) ? to : [to];
  if (!isEmailConfigured || !resend) {
    console.info(
      `[email:console] (no RESEND_API_KEY) → to=${recipients.join(", ")} subject="${subject}"`,
    );
    return { ok: true, skipped: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject,
      react,
      replyTo: replyTo ?? EMAIL_REPLY_TO,
    });
    if (error) {
      console.error(`[email] send failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] send threw: ${message}`);
    return { ok: false, error: message };
  }
}
