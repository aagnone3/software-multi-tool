-- CreateEnum
CREATE TYPE "public"."FeedbackRating" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateTable
CREATE TABLE "public"."tool_feedback" (
    "id" TEXT NOT NULL,
    "toolSlug" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,
    "rating" "public"."FeedbackRating" NOT NULL,
    "chatTranscript" TEXT,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tool_feedback_toolSlug_idx" ON "public"."tool_feedback"("toolSlug");

-- CreateIndex
CREATE INDEX "tool_feedback_userId_idx" ON "public"."tool_feedback"("userId");

-- CreateIndex
CREATE INDEX "tool_feedback_jobId_idx" ON "public"."tool_feedback"("jobId");

-- CreateIndex
CREATE INDEX "tool_feedback_rating_idx" ON "public"."tool_feedback"("rating");

-- CreateIndex
CREATE INDEX "tool_feedback_createdAt_idx" ON "public"."tool_feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."tool_feedback" ADD CONSTRAINT "tool_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tool_feedback" ADD CONSTRAINT "tool_feedback_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."tool_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
