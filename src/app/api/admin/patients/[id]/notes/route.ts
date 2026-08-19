import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPatientNoteSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createPatientNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nota inválida" }, { status: 400 });
  }

  const note = await prisma.patientNote.create({
    data: {
      patientId: id,
      content: parsed.data.content,
      authorName: session.username,
      authorRole: session.role,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
