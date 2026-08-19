import { z } from "zod";

/** El Salvador DUI: 8 digits + check digit, with or without the dash. Normalized to "########-#". */
export const duiSchema = z
  .string()
  .trim()
  .regex(/^\d{8}-?\d$/, "DUI inválido (formato 00000000-0)")
  .transform((v) => (v.includes("-") ? v : `${v.slice(0, 8)}-${v.slice(8)}`));

export const createAppointmentSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  minutes: z.number().int().min(0).max(24 * 60),
  name: z.string().trim().min(2, "Ingresa tu nombre completo").max(120),
  phone: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  email: z.string().trim().email("Ingresa un correo válido").max(160),
  visitType: z.enum(["primera", "seguimiento"]),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/** Admin-panel appointment creation (Doctora/Recepción). No email required, DUI required, links to an existing Patient when provided. */
export const createAdminAppointmentSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  minutes: z.number().int().min(0).max(24 * 60),
  patientId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2, "Ingresa el nombre completo").max(120),
  phone: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  dui: duiSchema,
  email: z.string().trim().email("Ingresa un correo válido").max(160).optional().or(z.literal("")),
});

export type CreateAdminAppointmentInput = z.infer<typeof createAdminAppointmentSchema>;

export const APPOINTMENT_STATUSES = ["pendiente", "confirmada", "cancelada", "completada"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});

// Separate attendance checkmark — no email side effects, see AttendanceStatusSelect.
export const ATTENDANCE_STATUSES = ["pendiente", "visto", "cancelado", "reprogramado"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const updateAttendanceStatusSchema = z.object({
  attendanceStatus: z.enum(ATTENDANCE_STATUSES),
});

export const updatePatientSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre completo").max(120),
  phone: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  dui: duiSchema.optional().or(z.literal("")),
  email: z.string().trim().email("Ingresa un correo válido").max(160).optional().or(z.literal("")),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const createPatientNoteSchema = z.object({
  content: z.string().trim().min(1, "La nota no puede estar vacía").max(2000),
});

export const createClinicalRecordEntrySchema = z.object({
  content: z.string().trim().min(1, "El registro no puede estar vacío").max(8000),
});

const timeRangeSchema = z
  .object({
    startMinutes: z.number().int().min(0).max(24 * 60 - 1),
    endMinutes: z.number().int().min(1).max(24 * 60),
  })
  .refine((r) => r.endMinutes > r.startMinutes, { message: "La hora de fin debe ser después del inicio" });

export const updateWorkingHoursSchema = z.object({
  slotDurationMinutes: z.number().int().min(5).max(240),
  minLeadMinutes: z.number().int().min(0).max(7 * 24 * 60),
  days: z.record(z.string(), z.array(timeRangeSchema)),
});

export type UpdateWorkingHoursInput = z.infer<typeof updateWorkingHoursSchema>;

export const createBlockedPeriodSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    startMinutes: z.number().int().min(0).max(24 * 60 - 1).nullable(),
    endMinutes: z.number().int().min(1).max(24 * 60).nullable(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "La fecha de fin debe ser igual o posterior al inicio" })
  .refine((v) => (v.startMinutes == null) === (v.endMinutes == null), {
    message: "Define ambas horas o ninguna (para bloquear el día completo)",
  })
  .refine((v) => v.startMinutes == null || v.endMinutes == null || v.endMinutes > v.startMinutes, {
    message: "La hora de fin debe ser después del inicio",
  });

export type CreateBlockedPeriodInput = z.infer<typeof createBlockedPeriodSchema>;

export const updateEmailTemplateSchema = z.object({
  confirmSubject: z.string().trim().min(1, "El asunto no puede estar vacío").max(200),
  confirmBody: z.string().trim().min(1, "El mensaje no puede estar vacío").max(4000),
  cancelSubject: z.string().trim().min(1, "El asunto no puede estar vacío").max(200),
  cancelBody: z.string().trim().min(1, "El mensaje no puede estar vacío").max(4000),
  reminderSubject: z.string().trim().min(1, "El asunto no puede estar vacío").max(200),
  reminderBody: z.string().trim().min(1, "El mensaje no puede estar vacío").max(4000),
  patientCancelSubject: z.string().trim().min(1, "El asunto no puede estar vacío").max(200),
  patientCancelBody: z.string().trim().min(1, "El mensaje no puede estar vacío").max(4000),
});

export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;

export const manageAppointmentSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reschedule"),
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    minutes: z.number().int().min(0).max(24 * 60),
  }),
  z.object({ action: z.literal("cancel") }),
]);

export type ManageAppointmentInput = z.infer<typeof manageAppointmentSchema>;
