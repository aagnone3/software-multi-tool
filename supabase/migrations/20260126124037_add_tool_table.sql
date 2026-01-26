-- AlterTable
ALTER TABLE "public"."agent_session" ADD COLUMN     "toolId" TEXT;

-- AlterTable
ALTER TABLE "public"."credit_transaction" ADD COLUMN     "toolId" TEXT;

-- AlterTable
ALTER TABLE "public"."rate_limit_entry" ADD COLUMN     "toolId" TEXT;

-- AlterTable
ALTER TABLE "public"."tool_job" ADD COLUMN     "toolId" TEXT;

-- CreateTable
CREATE TABLE "public"."tool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "creditCost" INTEGER NOT NULL DEFAULT 1,
    "creditUnit" TEXT NOT NULL DEFAULT 'request',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tool_slug_key" ON "public"."tool"("slug");

-- CreateIndex
CREATE INDEX "agent_session_toolId_idx" ON "public"."agent_session"("toolId");

-- CreateIndex
CREATE INDEX "credit_transaction_toolId_idx" ON "public"."credit_transaction"("toolId");

-- CreateIndex
CREATE INDEX "rate_limit_entry_toolId_idx" ON "public"."rate_limit_entry"("toolId");

-- CreateIndex
CREATE INDEX "tool_job_toolId_idx" ON "public"."tool_job"("toolId");

-- AddForeignKey
ALTER TABLE "public"."agent_session" ADD CONSTRAINT "agent_session_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "public"."tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tool_job" ADD CONSTRAINT "tool_job_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "public"."tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rate_limit_entry" ADD CONSTRAINT "rate_limit_entry_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "public"."tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_transaction" ADD CONSTRAINT "credit_transaction_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "public"."tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed tools from config/index.ts registry
-- Note: Tool sync from config is handled at application startup; this seeds initial data
INSERT INTO "public"."tool" ("id", "slug", "name", "description", "icon", "creditCost", "creditUnit", "enabled", "public", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'bg-remover', 'Background Remover', 'Remove backgrounds from images with AI', 'image-minus', 1, 'request', false, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'speaker-separation', 'Speaker Separation', 'Separate and identify speakers in audio files with timestamps and transcripts', 'audio-lines', 2, 'minute', true, false, NOW(), NOW()),
  (gen_random_uuid()::text, 'news-analyzer', 'News Analyzer', 'Analyze news articles for bias and sentiment', 'newspaper', 1, 'request', true, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'invoice-processor', 'Invoice Processor', 'Extract data from invoices using AI for easy accounting integration', 'receipt', 3, 'request', true, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'contract-analyzer', 'Contract Analyzer', 'Analyze contracts for key terms, risks, and obligations', 'file-text', 5, 'page', false, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'feedback-analyzer', 'Customer Feedback Analyzer', 'Analyze customer reviews and feedback for sentiment and insights', 'message-square-text', 1, 'request', false, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'expense-categorizer', 'Expense Categorizer', 'Automatically categorize expenses for tax and accounting purposes', 'wallet', 1, 'request', false, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'meeting-summarizer', 'Meeting Summarizer', 'Summarize meeting notes and extract action items automatically', 'clipboard-list', 2, 'request', false, true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;
