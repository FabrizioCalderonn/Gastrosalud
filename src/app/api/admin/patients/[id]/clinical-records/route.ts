import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasRole } from "@/lib/auth";
import { createClinicalRecordEntrySchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!hasRole(session, ["doctora"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createClinicalRecordEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Registro inválido" }, { status: 400 });
  }

  const entry = await prisma.clinicalRecordEntry.create({
    data: {
      patientId: id,
      content: parsed.data.content,
      authorName: session!.username,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
