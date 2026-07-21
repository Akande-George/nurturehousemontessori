import "server-only";
import { sendHtmlEmail } from "./send";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Minimal branded email shell.
function shell(schoolName: string, body: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8f9fa;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eef0f2;border-radius:16px;overflow:hidden">
      <div style="background:#0c5c4c;color:#ffffff;padding:20px 28px;font-size:18px;font-weight:600">${schoolName}</div>
      <div style="padding:28px;color:#1e293b;font-size:15px;line-height:1.6">${body}</div>
      <div style="padding:16px 28px;color:#94a3b8;font-size:12px;border-top:1px solid #eef0f2">
        Sent via Nurturehouse School Hub · <a href="${APP_URL}/login" style="color:#0c5c4c">Open your portal</a>
      </div>
    </div>
  </div>`;
}

// One-time sign-in code (we generate the OTP ourselves and deliver it via
// Resend, so login never depends on Supabase's built-in email/SMTP).
export function sendOtpCode(recipient: string, code: string) {
  return sendHtmlEmail({
    to: recipient,
    subject: `Your sign-in code: ${code}`,
    html: shell(
      "Nurturehouse School Hub",
      `<h2 style="margin:0 0 12px;font-size:18px">Your sign-in code</h2>
       <p style="margin:0 0 16px;color:#64748b">Enter this code to finish signing in. It expires in a few minutes.</p>
       <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#0c5c4c;background:#f1f5f9;border-radius:12px;padding:18px 0;text-align:center">${code}</div>
       <p style="margin:16px 0 0;color:#94a3b8;font-size:13px">If you didn't request this, you can safely ignore this email.</p>`,
    ),
  });
}

// Parent portal invitation — sent when an admin grants a family portal access.
export function sendParentPortalInvite(
  recipient: string,
  schoolName: string,
  loginUrl: string,
) {
  return sendHtmlEmail({
    to: recipient,
    subject: `You're invited to the ${schoolName} parent portal`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">Welcome to the parent portal</h2>
       <p style="margin:0 0 16px">${schoolName} has set up portal access for your family. You can view daily updates, reports, notices, and invoices in one place.</p>
       <p style="margin:0 0 16px;color:#64748b">To sign in, go to the portal and enter your email — we'll send you a one-time code. Use this same email address:</p>
       <p style="margin:0 0 20px;font-weight:600">${recipient}</p>
       <a href="${loginUrl}" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Open the parent portal</a>`,
    ),
  });
}

export function sendNoticeFanout(
  recipients: string[],
  schoolName: string,
  notice: { title: string; content: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: ${notice.title}`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">${notice.title}</h2>
       <p style="margin:0 0 16px;white-space:pre-line">${notice.content}</p>
       <a href="${APP_URL}/parent/notices" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View on the notice board</a>`,
    ),
  });
}

export function sendInvoiceIssued(
  recipient: string,
  schoolName: string,
  invoice: { description: string; amount: string; dueDate: string; invoiceId: string },
) {
  return sendHtmlEmail({
    to: recipient,
    subject: `${schoolName}: New invoice — ${invoice.description}`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">New invoice</h2>
       <p style="margin:0 0 4px">${invoice.description}</p>
       <p style="margin:0 0 4px;font-size:22px;font-weight:700">${invoice.amount}</p>
       <p style="margin:0 0 16px;color:#64748b">Due ${invoice.dueDate}</p>
       <a href="${APP_URL}/invoice/${invoice.invoiceId}" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View invoice</a>`,
    ),
  });
}

export function sendHomeworkAssigned(
  recipients: string[],
  schoolName: string,
  hw: { title: string; subject: string; dueDate: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: New homework — ${hw.title}`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">New homework assigned</h2>
       <p style="margin:0 0 4px"><strong>${hw.subject}</strong> — ${hw.title}</p>
       <p style="margin:0 0 16px;color:#64748b">Due ${hw.dueDate}</p>
       <a href="${APP_URL}/parent/homework" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View homework</a>`,
    ),
  });
}

export function sendAbsenceAlert(
  recipients: string[],
  schoolName: string,
  info: { studentName: string; date: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: ${info.studentName} marked absent`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">Attendance notice</h2>
       <p style="margin:0 0 8px">${info.studentName} was marked <strong>absent</strong> on ${info.date}.</p>
       <p style="margin:0;color:#64748b">If this is unexpected, please contact the school.</p>`,
    ),
  });
}

export function sendFeverAlert(
  recipients: string[],
  schoolName: string,
  info: { studentName: string; temperature: string; time: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `⚠️ ${schoolName}: ${info.studentName} has a raised temperature`,
    html: shell(
      schoolName,
      `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:12px">
         <p style="margin:0;color:#b91c1c;font-weight:600">Health alert</p>
       </div>
       <p style="margin:0 0 8px">${info.studentName} recorded a temperature of <strong>${info.temperature}°C</strong> at ${info.time}.</p>
       <p style="margin:0;color:#64748b">Our staff are monitoring. Please be reachable — we may ask you to collect your child.</p>`,
    ),
  });
}

export function sendAfterSchoolConfirm(
  recipients: string[],
  schoolName: string,
  info: { studentName: string; enrolled: boolean },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: After-school care ${info.enrolled ? "enrolment" : "cancellation"}`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">After-school care</h2>
       <p style="margin:0">${info.studentName} has been ${info.enrolled ? "<strong>enrolled in</strong>" : "<strong>removed from</strong>"} after-school care.${info.enrolled ? " A monthly fee applies and will be invoiced." : ""}</p>`,
    ),
  });
}

export function sendStatusChange(
  recipients: string[],
  schoolName: string,
  status: string,
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: account status is now "${status}"`,
    html: shell(
      schoolName,
      `<p style="margin:0 0 8px">Your school's platform account status has been changed to <strong>${status}</strong>.</p>
       ${status === "suspended" ? '<p style="margin:0;color:#b91c1c">While suspended, staff and parents may have limited access. Please contact platform support.</p>' : ""}`,
    ),
  });
}

export function sendApplicationReceived(
  recipient: string,
  schoolName: string,
  info: { childName: string },
) {
  return sendHtmlEmail({
    to: recipient,
    subject: `${schoolName}: We received your application for ${info.childName}`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">Application received</h2>
       <p style="margin:0 0 8px">Thank you for applying to ${schoolName} for <strong>${info.childName}</strong>.</p>
       <p style="margin:0;color:#64748b">Our admissions team will review your application and be in touch.</p>`,
    ),
  });
}

export function sendNewApplicationAlert(
  recipients: string[],
  schoolName: string,
  info: { childName: string; parentName: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: New enrolment application — ${info.childName}`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">New application</h2>
       <p style="margin:0 0 4px"><strong>${info.childName}</strong> (parent: ${info.parentName})</p>
       <a href="${APP_URL}/dashboard/enrollment" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Review applications</a>`,
    ),
  });
}

export function sendApplicationAccepted(
  recipient: string,
  schoolName: string,
  info: { childName: string },
) {
  return sendHtmlEmail({
    to: recipient,
    subject: `🎉 ${schoolName}: ${info.childName} has been accepted!`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">Congratulations!</h2>
       <p style="margin:0 0 8px">We're delighted to offer <strong>${info.childName}</strong> a place at ${schoolName}.</p>
       <p style="margin:0 0 16px;color:#64748b">You'll receive a portal invitation to complete enrolment.</p>`,
    ),
  });
}

export function sendReportCardPublished(
  recipients: string[],
  schoolName: string,
  info: { studentName: string; term: string; average: string; position: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${schoolName}: ${info.studentName}'s ${info.term} report card`,
    html: shell(
      schoolName,
      `<h2 style="margin:0 0 12px;font-size:18px">${info.studentName}'s report card is ready</h2>
       <p style="margin:0 0 4px">${info.term} · Average ${info.average} · Position ${info.position}</p>
       <a href="${APP_URL}/parent/results" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View report card</a>`,
    ),
  });
}
