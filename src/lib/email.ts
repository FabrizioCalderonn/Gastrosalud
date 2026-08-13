import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { formatDateFull } from "@/lib/format";
import { formatTime } from "@/lib/schedule";

export const EMAIL_PLACEHOLDERS = ["nombre", "fecha", "hora"] as const;

const DEFAULT_TEMPLATE = {
  confirmSubject: "Tu cita en GastroSalud fue confirmada",
  confirmBody:
    "Hola {{nombre}},\n\nTu cita en GastroSalud quedó confirmada para el {{fecha}} a las {{hora}}.\n\n¡Te esperamos!",
  cancelSubject: "Tu cita en GastroSalud fue cancelada",
  cancelBody:
    "Hola {{nombre}},\n\nLamentamos informarte que tu cita para el {{fecha}} a las {{hora}} fue cancelada.\n\nPara reprogramar, contáctanos o agenda de nuevo en el sitio web.",
};

export async function getEmailTemplate() {
  const row = await prisma.emailTemplate.findUnique({ where: { id: 1 } });
  return {
    confirmSubject: row?.confirmSubject ?? DEFAULT_TEMPLATE.confirmSubject,
    confirmBody: row?.confirmBody ?? DEFAULT_TEMPLATE.confirmBody,
    cancelSubject: row?.cancelSubject ?? DEFAULT_TEMPLATE.cancelSubject,
    cancelBody: row?.cancelBody ?? DEFAULT_TEMPLATE.cancelBody,
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
  email: string;
  dateKey: string;
  minutes: number;
};

export async function sendAppointmentStatusEmail(
  input: AppointmentEmailInput,
  status: "confirmada" | "cancelada",
): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    return { sent: false, error: "Envío de correo no configurado (falta RESEND_API_KEY o EMAIL_FROM)" };
  }

  const dateLabel = formatDateFull(input.dateKey);
  const timeLabel = formatTime(input.minutes);
  const template = await getEmailTemplate();

  const vars = {
    nombre: input.patientName,
    fecha: dateLabel,
    hora: timeLabel,
  };

  const rawSubject = status === "confirmada" ? template.confirmSubject : template.cancelSubject;
  const rawBody = status === "confirmada" ? template.confirmBody : template.cancelBody;

  const subject = fillPlaceholders(rawSubject, vars);
  const bodyHtml = fillPlaceholders(escapeHtml(rawBody), {
    nombre: escapeHtml(vars.nombre),
    fecha: escapeHtml(vars.fecha),
    hora: escapeHtml(vars.hora),
  }).replaceAll("\n", "<br/>");
  const html = `<p>${bodyHtml}</p>`;

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
