-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('DROP_CATCH', 'MEMORY_MATCH');

-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pot" TEXT NOT NULL DEFAULT 'TERRACOTTA',
ADD COLUMN     "scene" TEXT NOT NULL DEFAULT 'LIVING_ROOM',
ADD COLUMN     "unlockedPots" TEXT[] DEFAULT ARRAY['TERRACOTTA']::TEXT[],
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateTable
CREATE TABLE "GameResult" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "game" "GameType" NOT NULL,
    "score" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameResult_plantId_createdAt_idx" ON "GameResult"("plantId", "createdAt");

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
