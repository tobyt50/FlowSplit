-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('VIEW_USER_DETAILS', 'SUSPEND_USER', 'UNSUSPEND_USER', 'VIEW_TRANSACTION_LOGS', 'FLAG_TRANSACTION');

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUserId" TEXT NOT NULL,
    "adminUserEmail" TEXT NOT NULL,
    "action" "AdminActionType" NOT NULL,
    "targetUserId" TEXT,
    "targetEntityId" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);
