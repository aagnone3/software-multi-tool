-- CreateEnum
CREATE TYPE "public"."CreditTransactionType" AS ENUM ('GRANT', 'USAGE', 'OVERAGE', 'REFUND', 'PURCHASE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "public"."credit_balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "included" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "overage" INTEGER NOT NULL DEFAULT 0,
    "purchasedCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_transaction" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "public"."CreditTransactionType" NOT NULL,
    "toolSlug" TEXT,
    "jobId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_balance_userId_key" ON "public"."credit_balance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_balance_organizationId_key" ON "public"."credit_balance"("organizationId");

-- CreateIndex
CREATE INDEX "credit_balance_userId_idx" ON "public"."credit_balance"("userId");

-- CreateIndex
CREATE INDEX "credit_balance_organizationId_idx" ON "public"."credit_balance"("organizationId");

-- CreateIndex
CREATE INDEX "credit_balance_periodEnd_idx" ON "public"."credit_balance"("periodEnd");

-- CreateIndex
CREATE INDEX "credit_transaction_balanceId_idx" ON "public"."credit_transaction"("balanceId");

-- CreateIndex
CREATE INDEX "credit_transaction_toolSlug_idx" ON "public"."credit_transaction"("toolSlug");

-- CreateIndex
CREATE INDEX "credit_transaction_createdAt_idx" ON "public"."credit_transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."credit_balance" ADD CONSTRAINT "credit_balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_balance" ADD CONSTRAINT "credit_balance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_transaction" ADD CONSTRAINT "credit_transaction_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "public"."credit_balance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
