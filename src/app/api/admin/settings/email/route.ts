import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailTemplate } from "@/lib/email";
import { updateEmailTemplateSchema } from "@/lib/validation";

export async function GET() {
  const template = await getEmailTemplate();
  return NextResponse.json(template);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateEmailTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { confirmSubject, confirmBody, cancelSubject, cancelBody, reminderSubject, reminderBody } =
    parsed.data;
  await prisma.emailTemplate.upsert({
    where: { id: 1 },
    update: { confirmSubject, confirmBody, cancelSubject, cancelBody, reminderSubject, reminderBody },
    create: { id: 1, confirmSubject, confirmBody, cancelSubject, cancelBody, reminderSubject, reminderBody },
  });

  return NextResponse.json({ ok: true });
}
