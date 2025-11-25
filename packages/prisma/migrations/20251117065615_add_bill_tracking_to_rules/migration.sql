-- AlterTable
ALTER TABLE "SplitRule" ADD COLUMN     "dueDate" INTEGER,
ADD COLUMN     "isBill" BOOLEAN NOT NULL DEFAULT false;
