import { Resend } from "resend";
import { formatDateFull } from "@/lib/format";
import { formatTime } from "@/lib/schedule";

const CLINIC_NAME = "GastroSalud — Dra. Angelica Salgado";
const CLINIC_PHONE = "7867 9475";
const CLINIC_ADDRESS =
  "25 Calle Poniente entre 8ª y 10ª av. Sur #33, Centro Médico de Santa Ana, Clínica 24, Santa Ana, El Salvador";

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

  const subject =
    status === "confirmada"
      ? "Tu cita en GastroSalud fue confirmada"
      : "Tu cita en GastroSalud fue cancelada";

  const html =
    status === "confirmada"
      ? `<p>Hola ${escapeHtml(input.patientName)},</p>
         <p>Tu cita en <strong>${CLINIC_NAME}</strong> quedó <strong>confirmada</strong> para el
         ${escapeHtml(dateLabel)} a las ${escapeHtml(timeLabel)}.</p>
         <p>Dirección: ${escapeHtml(CLINIC_ADDRESS)}</p>
         <p>Cualquier duda, llámanos al ${escapeHtml(CLINIC_PHONE)}.</p>
         <p>¡Te esperamos!</p>`
      : `<p>Hola ${escapeHtml(input.patientName)},</p>
         <p>Lamentamos informarte que tu cita en <strong>${CLINIC_NAME}</strong> para el
         ${escapeHtml(dateLabel)} a las ${escapeHtml(timeLabel)} fue <strong>cancelada</strong>.</p>
         <p>Para reprogramar, contáctanos al ${escapeHtml(CLINIC_PHONE)} o agenda de nuevo en el sitio web.</p>
         <p>Disculpa las molestias.</p>`;

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
