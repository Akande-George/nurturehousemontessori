import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Null when unconfigured — `sendEmail` falls back to console logging so local
// dev works without a Resend key.
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;
export const isEmailConfigured = Boolean(apiKey);
