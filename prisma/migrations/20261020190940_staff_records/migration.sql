-- CreateEnum
CREATE TYPE "StaffKind" AS ENUM ('CAREGIVER', 'NURSE');

-- CreateEnum
CREATE TYPE "StaffFileKind" AS ENUM ('PHOTO', 'AADHAAR');

-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN     "careTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "education" TEXT,
ADD COLUMN     "kind" "StaffKind" NOT NULL DEFAULT 'CAREGIVER',
ADD COLUMN     "workCities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "LivingArea" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivingArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaregiverLivingArea" (
    "caregiverId" UUID NOT NULL,
    "livingAreaId" UUID NOT NULL,

    CONSTRAINT "CaregiverLivingArea_pkey" PRIMARY KEY ("caregiverId","livingAreaId")
);

-- CreateTable
CREATE TABLE "StaffFile" (
    "id" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "kind" "StaffFileKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LivingArea_name_key" ON "LivingArea"("name");

-- CreateIndex
CREATE INDEX "CaregiverLivingArea_livingAreaId_idx" ON "CaregiverLivingArea"("livingAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffFile_caregiverId_kind_key" ON "StaffFile"("caregiverId", "kind");

-- CreateIndex
CREATE INDEX "Caregiver_kind_archivedAt_idx" ON "Caregiver"("kind", "archivedAt");

-- AddForeignKey
ALTER TABLE "CaregiverLivingArea" ADD CONSTRAINT "CaregiverLivingArea_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverLivingArea" ADD CONSTRAINT "CaregiverLivingArea_livingAreaId_fkey" FOREIGN KEY ("livingAreaId") REFERENCES "LivingArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffFile" ADD CONSTRAINT "StaffFile_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: keep each person's existing outside-Delhi areas as work cities,
-- so editing a profile with the new form does not lose them.
UPDATE "Caregiver" c
SET "workCities" = sub.cities
FROM (
  SELECT ca."caregiverId",
         array_agg(DISTINCT CASE WHEN sa.city IN ('Gurugram', 'Noida', 'Ghaziabad', 'Faridabad') THEN sa.city ELSE 'Other' END) AS cities
  FROM "CaregiverArea" ca
  JOIN "ServiceArea" sa ON sa.id = ca."serviceAreaId"
  WHERE sa.city <> 'Delhi'
  GROUP BY ca."caregiverId"
) sub
WHERE c.id = sub."caregiverId";
