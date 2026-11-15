-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('WATER', 'SUN', 'FERTILIZE');

-- CreateTable
CREATE TABLE "CareEvent" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "type" "CareType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareEvent_plantId_type_occurredAt_idx" ON "CareEvent"("plantId", "type", "occurredAt");

-- AddForeignKey
ALTER TABLE "CareEvent" ADD CONSTRAINT "CareEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
