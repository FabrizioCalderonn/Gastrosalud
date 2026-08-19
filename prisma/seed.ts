import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLE_ACCOUNTS: { role: Role; name: string; envPrefix: string }[] = [
  { role: "doctora", name: "Doctora", envPrefix: "DOCTORA" },
  { role: "laboratorista", name: "Laboratorista", envPrefix: "LABORATORISTA" },
  { role: "recepcion", name: "Recepción", envPrefix: "RECEPCION" },
];

async function seedStaffAccounts() {
  let seededAny = false;
  for (const { role, name, envPrefix } of ROLE_ACCOUNTS) {
    const username = process.env[`${envPrefix}_SEED_USERNAME`];
    const password = process.env[`${envPrefix}_SEED_PASSWORD`];
    if (!username || !password) {
      console.log(`Skipping ${role} account: ${envPrefix}_SEED_USERNAME/PASSWORD not set`);
      continue;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.adminUser.upsert({
      where: { username },
      update: { passwordHash, role },
      create: { username, passwordHash, name, role },
    });
    console.log(`${role} account ready: ${user.username}`);
    seededAny = true;
  }
  if (!seededAny) {
    throw new Error(
      "No staff account env vars set — configure at least one of DOCTORA_/LABORATORISTA_/RECEPCION_SEED_USERNAME+PASSWORD in .env.",
    );
  }
}

async function main() {
  await seedStaffAccounts();

  await prisma.scheduleSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, slotDurationMinutes: 30 },
  });

  const existingRanges = await prisma.workingHoursRange.count();
  if (existingRanges === 0) {
    // Default schedule: Mon–Fri 8–12 & 2–5pm, Sat 9am–1pm, Sun closed.
    const weekday = [
      { startMinutes: 8 * 60, endMinutes: 12 * 60 },
      { startMinutes: 14 * 60, endMinutes: 17 * 60 },
    ];
    const saturday = [{ startMinutes: 9 * 60, endMinutes: 13 * 60 }];
    await prisma.workingHoursRange.createMany({
      data: [1, 2, 3, 4, 5]
        .flatMap((dayOfWeek) => weekday.map((r) => ({ dayOfWeek, ...r })))
        .concat(saturday.map((r) => ({ dayOfWeek: 6, ...r }))),
    });
    console.log("Default working hours seeded (Mon–Fri, Sat)");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
