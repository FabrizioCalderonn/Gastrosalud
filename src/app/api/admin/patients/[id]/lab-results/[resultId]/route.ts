import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> },
) {
  const { id, resultId } = await params;
  const result = await prisma.labResult.findUnique({ where: { id: resultId } });
  if (!result || result.patientId !== id) {
    return NextResponse.json({ error: "Resultado no encontrado" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.fileData), {
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `inline; filename="${result.fileName.replace(/"/g, "")}"`,
      "Content-Length": String(result.fileSize),
    },
  });
}
