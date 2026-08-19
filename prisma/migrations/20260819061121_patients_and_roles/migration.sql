-- CreateEnum
CREATE TYPE "Role" AS ENUM ('doctora', 'laboratorista', 'recepcion');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'doctora';

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dui" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_dui_key" ON "Patient"("dui");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Patient_name_idx" ON "Patient"("name");

-- CreateTable
CREATE TABLE "PatientNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientNote_patientId_idx" ON "PatientNote"("patientId");

-- AddForeignKey
ALTER TABLE "PatientNote" ADD CONSTRAINT "PatientNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ClinicalRecordEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalRecordEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalRecordEntry_patientId_idx" ON "ClinicalRecordEntry"("patientId");

-- AddForeignKey
ALTER TABLE "ClinicalRecordEntry" ADD CONSTRAINT "ClinicalRecordEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSize" INTEGER NOT NULL,
    "fileData" BYTEA NOT NULL,
    "label" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabResult_patientId_idx" ON "LabResult"("patientId");

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (nullable first — backfilled below, then locked to NOT NULL)
ALTER TABLE "Appointment" ADD COLUMN     "patientId" TEXT,
ADD COLUMN     "dui" TEXT,
ADD COLUMN     "attendanceStatus" TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE "Appointment" ALTER COLUMN "email" DROP NOT NULL;

-- Backfill: one Patient per distinct existing phone, using that phone's most
-- recent appointment for name/email, then link every appointment to it.
INSERT INTO "Patient" ("id", "name", "phone", "email", "createdAt", "updatedAt")
SELECT DISTINCT ON (a.phone) gen_random_uuid()::text, a."patientName", a.phone, a.email, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Appointment" a
ORDER BY a.phone, a."createdAt" DESC;

UPDATE "Appointment" a
SET "patientId" = p.id
FROM "Patient" p
WHERE p.phone = a.phone;

-- Now that every existing row has a patient, enforce the FK going forward.
ALTER TABLE "Appointment" ALTER COLUMN "patientId" SET NOT NULL;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
