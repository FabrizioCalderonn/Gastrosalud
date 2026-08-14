-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "patientCancelSubject" TEXT NOT NULL DEFAULT 'Tu cita en GastroSalud fue cancelada',
ADD COLUMN     "patientCancelBody" TEXT NOT NULL DEFAULT 'Hola {{nombre}},

Confirmamos que cancelaste tu cita del {{fecha}} a las {{hora}}.

Si deseas agendar una nueva, visita el sitio web cuando gustes.';
