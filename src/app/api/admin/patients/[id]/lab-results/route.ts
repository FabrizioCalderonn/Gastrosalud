import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasRole } from "@/lib/auth";

// Keep comfortably under Vercel's ~4.5MB serverless request body limit.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!hasRole(session, ["laboratorista"])) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const label = form?.get("label");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Adjunta un archivo PDF" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "El archivo debe ser un PDF" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "El PDF no puede pesar más de 4MB" }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
  if (!patient) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

  const fileData = Buffer.from(await file.arrayBuffer());
  const result = await prisma.labResult.create({
    data: {
      patientId: id,
      fileName: file.name || "resultado.pdf",
      mimeType: "application/pdf",
      fileSize: fileData.byteLength,
      fileData,
      label: typeof label === "string" && label.trim() ? label.trim() : null,
      uploadedBy: session!.username,
    },
    select: { id: true, fileName: true, fileSize: true, label: true, uploadedBy: true, createdAt: true },
  });

  return NextResponse.json({ result }, { status: 201 });
}
