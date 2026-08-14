-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "manageToken" TEXT,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "reminderSubject" TEXT NOT NULL DEFAULT 'Recordatorio: tu cita en GastroSalud es mañana',
ADD COLUMN     "reminderBody" TEXT NOT NULL DEFAULT 'Hola {{nombre}},

Te recordamos tu cita en GastroSalud mañana {{fecha}} a las {{hora}}.

¡Te esperamos!';

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_manageToken_key" ON "Appointment"("manageToken");
