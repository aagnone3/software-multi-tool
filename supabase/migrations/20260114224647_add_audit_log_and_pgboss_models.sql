-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'MFA_DISABLE', 'IMPERSONATE', 'INVITE', 'EXPORT', 'SUBSCRIPTION_CHANGE', 'PAYMENT');

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "organizationId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "public"."audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_idx" ON "public"."audit_log"("organizationId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "public"."audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_resource_idx" ON "public"."audit_log"("resource");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "public"."audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_expiresAt_idx" ON "public"."audit_log"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_log_userId_createdAt_idx" ON "public"."audit_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "public"."audit_log"("organizationId", "createdAt");
