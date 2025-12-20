-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('NIN_SLIP', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'INTERNATIONAL_PASSPORT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idImageKey" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" "IdType",
ADD COLUMN     "selfieKey" TEXT;
