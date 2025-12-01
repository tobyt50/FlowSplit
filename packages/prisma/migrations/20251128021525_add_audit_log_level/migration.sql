/*
  Warnings:

  - Added the required column `level` to the `AdminAuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditLogLevel" AS ENUM ('INFO', 'WARN', 'CRITICAL');

-- AlterTable
ALTER TABLE "AdminAuditLog" ADD COLUMN     "level" "AuditLogLevel" NOT NULL;
