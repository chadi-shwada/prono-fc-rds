-- AlterTable
ALTER TABLE "Match" ADD COLUMN "scheduleNum" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Match_scheduleNum_key" ON "Match"("scheduleNum");
