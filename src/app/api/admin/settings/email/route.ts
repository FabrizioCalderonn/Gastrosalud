import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailTemplate } from "@/lib/email";
import { updateEmailTemplateSchema } from "@/lib/validation";
import { getSession, hasRole } from "@/lib/auth";

export async function GET() {
  const template = await getEmailTemplate();
  return NextResponse.json(template);
}

export async function PUT(req: NextRequest) {
  if (!hasRole(await getSession(), ["doctora", "recepcion"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = updateEmailTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    confirmSubject,
    confirmBody,
    cancelSubject,
    cancelBody,
    reminderSubject,
    reminderBody,
    patientCancelSubject,
    patientCancelBody,
  } = parsed.data;
  const data = {
    confirmSubject,
    confirmBody,
    cancelSubject,
    cancelBody,
    reminderSubject,
    reminderBody,
    patientCancelSubject,
    patientCancelBody,
  };
  await prisma.emailTemplate.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json({ ok: true });
}
