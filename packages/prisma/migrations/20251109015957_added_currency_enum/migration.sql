/*
  Warnings:

  - The `currency` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `currency` column on the `Wallet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NGN');

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "balance" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Analytics" ALTER COLUMN "totalInflow" SET DATA TYPE BIGINT,
ALTER COLUMN "totalOutflow" SET DATA TYPE BIGINT,
ALTER COLUMN "totalSavings" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE BIGINT,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DATA TYPE BIGINT,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';
