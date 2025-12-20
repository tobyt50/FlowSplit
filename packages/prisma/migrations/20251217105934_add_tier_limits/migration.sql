-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('PAYOUT', 'INTERNAL_TRANSFER', 'CARD_SPEND');

-- CreateTable
CREATE TABLE "TierLimit" (
    "id" TEXT NOT NULL,
    "tier" "KycTier" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'NGN',
    "maxPerTransaction" BIGINT NOT NULL,
    "maxDaily" BIGINT NOT NULL,
    "maxMonthly" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TierLimit_tier_key" ON "TierLimit"("tier");
