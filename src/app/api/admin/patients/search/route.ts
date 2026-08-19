import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ patients: [] });

  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { dui: { contains: q } },
      ],
    },
    select: { id: true, name: true, phone: true, dui: true, email: true },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ patients });
}
