-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FROZEN', 'CANCELED');

-- CreateEnum
CREATE TYPE "CardProvider" AS ENUM ('STRIPE', 'BRIDGE_CARD');

-- CreateEnum
CREATE TYPE "CardTransactionStatus" AS ENUM ('PENDING', 'CLEARED', 'DECLINED', 'REVERSED');

-- AlterEnum
ALTER TYPE "WalletType" ADD VALUE 'LIABILITY';

-- CreateTable
CREATE TABLE "VirtualCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "nameOnCard" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" "Currency" NOT NULL DEFAULT 'NGN',
    "provider" "CardProvider" NOT NULL,
    "providerCardId" TEXT NOT NULL,
    "spendingLimit" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTransaction" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL,
    "merchantName" TEXT NOT NULL,
    "merchantCategory" TEXT,
    "status" "CardTransactionStatus" NOT NULL,
    "providerAuthId" TEXT NOT NULL,
    "providerTxId" TEXT,
    "ledgerTransactionId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "CardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VirtualCard_providerCardId_key" ON "VirtualCard"("providerCardId");

-- CreateIndex
CREATE UNIQUE INDEX "CardTransaction_providerAuthId_key" ON "CardTransaction"("providerAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "CardTransaction_ledgerTransactionId_key" ON "CardTransaction"("ledgerTransactionId");

-- AddForeignKey
ALTER TABLE "VirtualCard" ADD CONSTRAINT "VirtualCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualCard" ADD CONSTRAINT "VirtualCard_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTransaction" ADD CONSTRAINT "CardTransaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "VirtualCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
