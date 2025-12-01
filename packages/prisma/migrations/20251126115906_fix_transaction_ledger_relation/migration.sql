/*
  Warnings:

  - A unique constraint covering the columns `[ledgerTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "ledgerTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_ledgerTransactionId_key" ON "Transaction"("ledgerTransactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "LedgerTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
