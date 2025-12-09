/*
  Warnings:

  - A unique constraint covering the columns `[stripeCardholderId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'NG',
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stripeCardholderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCardholderId_key" ON "User"("stripeCardholderId");
