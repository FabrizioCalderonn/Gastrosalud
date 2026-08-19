import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { formatDateFull } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import { buildPatientToClinicWhatsAppLink } from "@/lib/whatsapp";

export const EMAIL_PLACEHOLDERS = ["nombre", "fecha", "hora"] as const;

const DEFAULT_TEMPLATE = {
  confirmSubject: "Tu cita en GastroSalud fue confirmada",
  confirmBody:
    "Hola {{nombre}},\n\nTu cita en GastroSalud quedó confirmada para el {{fecha}} a las {{hora}}.\n\n¡Te esperamos!",
  cancelSubject: "Tu cita en GastroSalud fue cancelada",
  cancelBody:
    "Hola {{nombre}},\n\nLamentamos informarte que tu cita para el {{fecha}} a las {{hora}} fue cancelada.\n\nPara reprogramar, contáctanos o agenda de nuevo en el sitio web.",
  reminderSubject: "Recordatorio: tu cita en GastroSalud es mañana",
  reminderBody:
    "Hola {{nombre}},\n\nTe recordamos tu cita en GastroSalud mañana {{fecha}} a las {{hora}}.\n\n¡Te esperamos!",
  patientCancelSubject: "Tu cita en GastroSalud fue cancelada",
  patientCancelBody:
    "Hola {{nombre}},\n\nConfirmamos que cancelaste tu cita del {{fecha}} a las {{hora}}.\n\nSi deseas agendar una nueva, visita el sitio web cuando gustes.",
};

export async function getEmailTemplate() {
  const row = await prisma.emailTemplate.findUnique({ where: { id: 1 } });
  return {
    confirmSubject: row?.confirmSubject ?? DEFAULT_TEMPLATE.confirmSubject,
    confirmBody: row?.confirmBody ?? DEFAULT_TEMPLATE.confirmBody,
    cancelSubject: row?.cancelSubject ?? DEFAULT_TEMPLATE.cancelSubject,
    cancelBody: row?.cancelBody ?? DEFAULT_TEMPLATE.cancelBody,
    reminderSubject: row?.reminderSubject ?? DEFAULT_TEMPLATE.reminderSubject,
    reminderBody: row?.reminderBody ?? DEFAULT_TEMPLATE.reminderBody,
    patientCancelSubject: row?.patientCancelSubject ?? DEFAULT_TEMPLATE.patientCancelSubject,
    patientCancelBody: row?.patientCancelBody ?? DEFAULT_TEMPLATE.patientCancelBody,
  };
}

function fillPlaceholders(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

type AppointmentEmailInput = {
  patientName: string;
  email: string | null;
  dateKey: string;
  minutes: number;
  manageToken?: string | null;
};

/** "Gestiona tu cita" link + WhatsApp button appended below the message body. */
function buildFooterHtml(input: AppointmentEmailInput): string {
  const parts: string[] = [];
  if (input.manageToken) {
    const siteUrl = process.env.SITE_URL ?? "https://gastrosaludsv.com";
    const manageUrl = `${siteUrl}/mi-cita/${input.manageToken}`;
    parts.push(`<p><a href="${manageUrl}">Gestionar mi cita</a></p>`);
  }
  const whatsappUrl = buildPatientToClinicWhatsAppLink({
    patientName: input.patientName,
    dateKey: input.dateKey,
    minutes: input.minutes,
  });
  parts.push(`<p><a href="${whatsappUrl}">Escribirnos por WhatsApp</a></p>`);
  return parts.join("\n");
}

function renderEmailHtml(rawSubject: string, rawBody: string, input: AppointmentEmailInput) {
  const vars = {
    nombre: input.patientName,
    fecha: formatDateFull(input.dateKey),
    hora: formatTime(input.minutes),
  };
  const subject = fillPlaceholders(rawSubject, vars);
  const bodyHtml = fillPlaceholders(escapeHtml(rawBody), {
    nombre: escapeHtml(vars.nombre),
    fecha: escapeHtml(vars.fecha),
    hora: escapeHtml(vars.hora),
  }).replaceAll("\n", "<br/>");
  const html = `<p>${bodyHtml}</p>${buildFooterHtml(input)}`;
  return { subject, html };
}

async function sendEmail(
  input: AppointmentEmailInput,
  rawSubject: string,
  rawBody: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!input.email) {
    return { sent: false, error: "El paciente no tiene correo registrado" };
  }
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    return { sent: false, error: "Envío de correo no configurado (falta RESEND_API_KEY o EMAIL_FROM)" };
  }

  const { subject, html } = renderEmailHtml(rawSubject, rawBody, input);

  try {
    const result = await resend.emails.send({
      from,
      to: input.email,
      subject,
      html,
    });
    if (result.error) return { sent: false, error: result.error.message };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function sendAppointmentStatusEmail(
  input: AppointmentEmailInput,
  status: "confirmada" | "cancelada",
): Promise<{ sent: boolean; error?: string }> {
  const template = await getEmailTemplate();
  const rawSubject = status === "confirmada" ? template.confirmSubject : template.cancelSubject;
  const rawBody = status === "confirmada" ? template.confirmBody : template.cancelBody;
  return sendEmail(input, rawSubject, rawBody);
}

export async function sendAppointmentReminderEmail(
  input: AppointmentEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const template = await getEmailTemplate();
  return sendEmail(input, template.reminderSubject, template.reminderBody);
}

/** Cancellation confirmation sent when the PATIENT cancels their own appointment (vs. the clinic cancelling). */
export async function sendPatientCancelEmail(
  input: AppointmentEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const template = await getEmailTemplate();
  return sendEmail(input, template.patientCancelSubject, template.patientCancelBody);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
