-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "KycTier" AS ENUM ('TIER_0', 'TIER_1', 'TIER_2');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bvn" TEXT,
ADD COLUMN     "kycRejectionReason" TEXT,
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "kycTier" "KycTier" NOT NULL DEFAULT 'TIER_0';
