import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Set ADMIN_SEED_USERNAME and ADMIN_SEED_PASSWORD (in .env) before seeding the admin account.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash, name: "Administrador" },
  });

  console.log(`Admin user ready: ${user.username}`);

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
