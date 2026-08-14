import { formatDateFull } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import type { AppointmentStatus } from "@/lib/validation";

// El Salvador country code — used when the patient's phone was entered without one.
const DEFAULT_COUNTRY_CODE = "503";
const CLINIC_PHONE = "7867 9475";

function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length > 8) return digits;
  if (digits.length === 8) return DEFAULT_COUNTRY_CODE + digits;
  return digits;
}

function messageForStatus(
  status: AppointmentStatus,
  patientName: string,
  dateLabel: string,
  timeLabel: string,
): string {
  switch (status) {
    case "confirmada":
      return `Hola ${patientName}, te escribimos de GastroSalud (Dra. Angelica Salgado) para confirmar tu cita del ${dateLabel} a las ${timeLabel}. ¡Te esperamos!`;
    case "cancelada":
      return `Hola ${patientName}, te escribimos de GastroSalud para informarte que tu cita del ${dateLabel} a las ${timeLabel} fue cancelada. Contáctanos al ${CLINIC_PHONE} para reprogramar. Disculpa las molestias.`;
    case "completada":
      return `Hola ${patientName}, gracias por tu visita a GastroSalud el ${dateLabel}. Cualquier duda sobre tu consulta, contáctanos al ${CLINIC_PHONE}.`;
    default:
      return `Hola ${patientName}, te escribimos de GastroSalud para recordarte tu cita del ${dateLabel} a las ${timeLabel}. Cualquier duda, contáctanos al ${CLINIC_PHONE}.`;
  }
}

/** Link opened by the PATIENT to message the clinic's WhatsApp, prefilled from their side. */
export function buildPatientToClinicWhatsAppLink(input: {
  patientName: string;
  dateKey: string;
  minutes: number;
}): string {
  const clinicNumber = normalizePhoneForWhatsApp(CLINIC_PHONE);
  const message = `Hola, soy ${input.patientName}. Tengo una cita el ${formatDateFull(input.dateKey)} a las ${formatTime(input.minutes)} y quisiera escribirles por este medio.`;
  return `https://wa.me/${clinicNumber}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppLink(input: {
  phone: string;
  patientName: string;
  dateKey: string;
  minutes: number;
  status: AppointmentStatus;
}): string {
  const number = normalizePhoneForWhatsApp(input.phone);
  const message = messageForStatus(
    input.status,
    input.patientName,
    formatDateFull(input.dateKey),
    formatTime(input.minutes),
  );
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
