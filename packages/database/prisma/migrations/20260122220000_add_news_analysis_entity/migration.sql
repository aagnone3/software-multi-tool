-- CreateTable
CREATE TABLE "public"."news_analysis" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "sourceUrl" TEXT,
    "sourceText" TEXT,
    "title" TEXT,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_analysis_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."tool_job" ADD COLUMN     "newsAnalysisId" TEXT;

-- CreateIndex
CREATE INDEX "news_analysis_organizationId_idx" ON "public"."news_analysis"("organizationId");

-- CreateIndex
CREATE INDEX "news_analysis_userId_idx" ON "public"."news_analysis"("userId");

-- CreateIndex
CREATE INDEX "news_analysis_createdAt_idx" ON "public"."news_analysis"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tool_job_newsAnalysisId_key" ON "public"."tool_job"("newsAnalysisId");

-- AddForeignKey
ALTER TABLE "public"."tool_job" ADD CONSTRAINT "tool_job_newsAnalysisId_fkey" FOREIGN KEY ("newsAnalysisId") REFERENCES "public"."news_analysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_analysis" ADD CONSTRAINT "news_analysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_analysis" ADD CONSTRAINT "news_analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security on news_analysis table
-- Since this application uses Prisma (which connects via service role), it bypasses RLS.
-- By enabling RLS without creating any policies, we effectively deny all access
-- to this table via PostgREST while allowing Prisma/service role full access.
ALTER TABLE "public"."news_analysis" ENABLE ROW LEVEL SECURITY;
