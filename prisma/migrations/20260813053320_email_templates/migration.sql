-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "confirmSubject" TEXT NOT NULL DEFAULT 'Tu cita en GastroSalud fue confirmada',
    "confirmBody" TEXT NOT NULL DEFAULT 'Hola {{nombre}},

Tu cita en GastroSalud quedó confirmada para el {{fecha}} a las {{hora}}.

¡Te esperamos!',
    "cancelSubject" TEXT NOT NULL DEFAULT 'Tu cita en GastroSalud fue cancelada',
    "cancelBody" TEXT NOT NULL DEFAULT 'Hola {{nombre}},

Lamentamos informarte que tu cita para el {{fecha}} a las {{hora}} fue cancelada.

Para reprogramar, contáctanos o agenda de nuevo en el sitio web.',

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);
