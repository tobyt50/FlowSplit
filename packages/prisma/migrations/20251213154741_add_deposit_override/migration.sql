-- AlterTable
ALTER TABLE "User" ADD COLUMN     "depositOverrideWalletId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_depositOverrideWalletId_fkey" FOREIGN KEY ("depositOverrideWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
