import "server-only";
import { sendHtmlEmail } from "./send";
import { APP_URL, PORTAL_URL } from "@/lib/site-url";

// ---------------------------------------------------------------------------
// Escaping
//
// These bodies are hand-built HTML, and several of the values dropped into
// them are typed by someone other than the school: a parent's own profile
// name reaches a teacher in the report-comment mail, and the PUBLIC enrolment
// form's child/parent names reach staff in the new-application alert. Mail
// clients don't run script, but unescaped markup still lets a stranger inject
// styled text and links into a message staff read as coming from the school.
//
// So every interpolated value is escaped. Bodies use the `h` tagged template,
// which escapes by default; the handful of places that interpolate a literal
// fragment of our own markup opt out with `raw()`. Subjects are plain text —
// escaping them would show "&amp;" to the reader — so they only get their
// line breaks stripped, which is what could otherwise split a header.
// ---------------------------------------------------------------------------

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const RAW = Symbol("raw-html");
type RawHtml = { [RAW]: string };

/** Marks a string as markup we wrote ourselves, exempt from escaping. */
function raw(html: string): RawHtml {
  return { [RAW]: html };
}

/** Template tag that escapes every interpolated value. */
function h(
  strings: TemplateStringsArray,
  ...values: (string | number | RawHtml)[]
): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    out +=
      typeof value === "object" && value !== null && RAW in value
        ? value[RAW]
        : esc(String(value));
    out += strings[i + 1];
  }
  return out;
}

/** Subject-line safe: plain text, no line breaks to split the header with. */
function plain(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

// Minimal branded email shell.
function shell(schoolName: string, body: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8f9fa;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eef0f2;border-radius:16px;overflow:hidden">
      <div style="background:#0c5c4c;color:#ffffff;padding:20px 28px;font-size:18px;font-weight:600">${esc(schoolName)}</div>
      <div style="padding:28px;color:#1e293b;font-size:15px;line-height:1.6">${body}</div>
      <div style="padding:16px 28px;color:#94a3b8;font-size:12px;border-top:1px solid #eef0f2">
        Sent via Nurturehouse School Hub · <a href="${PORTAL_URL}" style="color:#0c5c4c">Open your portal</a>
      </div>
    </div>
  </div>`;
}

// One-time sign-in code (we generate the OTP ourselves and deliver it via
// Resend, so login never depends on Supabase's built-in email/SMTP).
export function sendOtpCode(recipient: string, code: string) {
  return sendHtmlEmail({
    to: recipient,
    subject: `Your sign-in code: ${plain(code)}`,
    html: shell(
      "Nurturehouse School Hub",
      h`<h2 style="margin:0 0 12px;font-size:18px">Your sign-in code</h2>
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
    subject: `You're invited to the ${plain(schoolName)} parent portal`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">Welcome to the parent portal</h2>
       <p style="margin:0 0 16px">${schoolName} has set up portal access for your family. You can view daily updates, reports, notices, and invoices in one place.</p>
       <p style="margin:0 0 16px;color:#64748b">To sign in, go to the portal and enter your email — we'll send you a one-time code. Use this same email address:</p>
       <p style="margin:0 0 20px;font-weight:600">${recipient}</p>
       <a href="${loginUrl}" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Open the parent portal</a>`,
    ),
  });
}

// Staff invitation — sent when an admin grants a teacher/admin portal access.
export function sendStaffInvite(
  recipient: string,
  schoolName: string,
  roleLabel: string,
  loginUrl: string,
) {
  return sendHtmlEmail({
    to: recipient,
    subject: `You've been added as ${plain(roleLabel)} at ${plain(schoolName)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">Welcome to the team</h2>
       <p style="margin:0 0 16px">${schoolName} has given you <strong>${roleLabel}</strong> access to the school portal.</p>
       <p style="margin:0 0 16px;color:#64748b">To sign in, go to the portal and enter your email — we'll send you a one-time code. Use this address:</p>
       <p style="margin:0 0 20px;font-weight:600">${recipient}</p>
       <a href="${loginUrl}" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Open the staff portal</a>`,
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
    subject: `${plain(schoolName)}: ${plain(notice.title)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">${notice.title}</h2>
       <p style="margin:0 0 16px;white-space:pre-line">${notice.content}</p>
       <a href="${APP_URL}/parent/notices" style="display:inline-block;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View on the notice board</a>`,
    ),
  });
}

export function sendInvoiceIssued(
  recipient: string,
  schoolName: string,
  invoice: {
    description: string;
    amount: string;
    dueDate: string;
    invoiceId: string;
    invoiceNo?: string | null;
    periodCovered?: string | null;
  },
) {
  const label = invoice.invoiceNo
    ? `Invoice ${invoice.invoiceNo}`
    : "New invoice";
  return sendHtmlEmail({
    to: recipient,
    subject: `${plain(schoolName)}: ${plain(label)} — ${plain(invoice.description)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">${label}</h2>
       <p style="margin:0 0 4px">${invoice.description}</p>
       ${invoice.periodCovered ? h`<p style="margin:0 0 4px;color:#64748b">Coverage: ${invoice.periodCovered}</p>` : ""}
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
    subject: `${plain(schoolName)}: New homework — ${plain(hw.title)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">New homework assigned</h2>
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
    subject: `${plain(schoolName)}: ${plain(info.studentName)} marked absent`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">Attendance notice</h2>
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
    subject: `⚠️ ${plain(schoolName)}: ${plain(info.studentName)} has a raised temperature`,
    html: shell(
      schoolName,
      h`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:12px">
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
    subject: `${plain(schoolName)}: After-school care ${plain(info.enrolled ? "enrolment" : "cancellation")}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">After-school care</h2>
       <p style="margin:0">${info.studentName} has been ${raw(info.enrolled ? "<strong>enrolled in</strong>" : "<strong>removed from</strong>")} after-school care.${info.enrolled ? " A monthly fee applies and will be invoiced." : ""}</p>`,
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
    subject: `${plain(schoolName)}: account status is now "${plain(status)}"`,
    html: shell(
      schoolName,
      h`<p style="margin:0 0 8px">Your school's platform account status has been changed to <strong>${status}</strong>.</p>
       ${raw(status === "suspended" ? '<p style="margin:0;color:#b91c1c">While suspended, staff and parents may have limited access. Please contact platform support.</p>' : "")}`,
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
    subject: `${plain(schoolName)}: We received your application for ${plain(info.childName)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">Application received</h2>
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
    subject: `${plain(schoolName)}: New enrolment application — ${plain(info.childName)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">New application</h2>
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
    subject: `🎉 ${plain(schoolName)}: ${plain(info.childName)} has been accepted!`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">Congratulations!</h2>
       <p style="margin:0 0 8px">We're delighted to offer <strong>${info.childName}</strong> a place at ${schoolName}.</p>
       <p style="margin:0 0 16px;color:#64748b">You'll receive a portal invitation to complete enrolment.</p>`,
    ),
  });
}

export function sendDailyReportPublished(
  recipients: string[],
  schoolName: string,
  info: { studentName: string; date: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${plain(schoolName)}: ${plain(info.studentName)}'s day — ${plain(info.date)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">${info.studentName}'s daily report is ready</h2>
       <p style="margin:0 0 4px">${info.date}</p>
       <p style="margin:0 0 4px;color:#64748b">Meals, rest, the work ${info.studentName} chose today, observations and photographs from the classroom.</p>
       <a href="${APP_URL}/parent/reports" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View daily report</a>`,
    ),
  });
}

export function sendProgressReportPublished(
  recipients: string[],
  schoolName: string,
  // `reportLabel` already reads as a sentence fragment — "First Term mid-term
  // report" or "First Term progress report" — so the two kinds of report need
  // no branching here.
  info: {
    studentName: string;
    reportLabel: string;
    term: string;
    period: string;
  },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${plain(schoolName)}: ${plain(info.studentName)}'s ${plain(info.reportLabel)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">${info.studentName}'s ${info.reportLabel} is ready</h2>
       <p style="margin:0 0 4px">${info.term} · ${info.period}</p>
       <p style="margin:0 0 4px;color:#64748b">It covers attendance, the lessons ${info.studentName} worked on, their care and routine, observations, photographs and your guide's summary. You can read it online or download a PDF.</p>
       <a href="${APP_URL}/parent/progress-reports" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View progress report</a>`,
    ),
  });
}

export function sendReportCardPublished(
  recipients: string[],
  schoolName: string,
  info: {
    studentName: string;
    term: string;
    average: string;
    position: string;
  },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${plain(schoolName)}: ${plain(info.studentName)}'s ${plain(info.term)} report card`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">${info.studentName}'s report card is ready</h2>
       <p style="margin:0 0 4px">${info.term} · Average ${info.average} · Position ${info.position}</p>
       <a href="${APP_URL}/parent/results" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View report card</a>`,
    ),
  });
}

// A teacher has shared a document on one child's materials shelf. Only that
// child's parents are ever on this recipient list.
export function sendChildMaterialShared(
  recipients: string[],
  schoolName: string,
  info: { studentName: string; title: string; category: string },
) {
  return sendHtmlEmail({
    to: recipients,
    subject: `${plain(schoolName)}: a new document for ${plain(info.studentName)}`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">${info.title}</h2>
       <p style="margin:0 0 4px">${info.category} · for ${info.studentName}</p>
       <p style="margin:0 0 4px;color:#64748b">${info.studentName}'s teacher has shared a document on their materials shelf. Open the portal to read or download it.</p>
       <a href="${APP_URL}/parent/materials" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">View child materials</a>`,
    ),
  });
}

// A family has written their comment on a published progress report. Goes to
// the guide who wrote it, not the whole staff room.
export function sendParentReportComment(
  recipient: string,
  schoolName: string,
  info: { studentName: string; parentName: string; reportLabel: string },
) {
  return sendHtmlEmail({
    to: recipient,
    subject: `${plain(schoolName)}: ${plain(info.parentName)} commented on ${plain(info.studentName)}'s report`,
    html: shell(
      schoolName,
      h`<h2 style="margin:0 0 12px;font-size:18px">A reply on ${info.studentName}'s report</h2>
       <p style="margin:0 0 4px">${info.parentName} · ${info.reportLabel}</p>
       <p style="margin:0 0 4px;color:#64748b">Their comment now appears above the signature line on the report.</p>
       <a href="${APP_URL}/teacher/reports/progress" style="display:inline-block;margin-top:12px;background:#0c5c4c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px">Open progress reports</a>`,
    ),
  });
}
