import { z } from "zod";

export const createAppointmentSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  minutes: z.number().int().min(0).max(24 * 60),
  name: z.string().trim().min(2, "Ingresa tu nombre completo").max(120),
  phone: z.string().trim().min(6, "Ingresa un teléfono válido").max(30),
  email: z.string().trim().email("Ingresa un correo válido").max(160),
  visitType: z.enum(["primera", "seguimiento"]),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const APPOINTMENT_STATUSES = ["pendiente", "confirmada", "cancelada", "completada"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});
