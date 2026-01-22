-- CreateTable
CREATE TABLE "public"."file" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_tag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_to_tag" (
    "fileId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_to_tag_pkey" PRIMARY KEY ("fileId","tagId")
);

-- CreateIndex
CREATE INDEX "file_organizationId_idx" ON "public"."file"("organizationId");

-- CreateIndex
CREATE INDEX "file_userId_idx" ON "public"."file"("userId");

-- CreateIndex
CREATE INDEX "file_mimeType_idx" ON "public"."file"("mimeType");

-- CreateIndex
CREATE INDEX "file_createdAt_idx" ON "public"."file"("createdAt");

-- CreateIndex
CREATE INDEX "file_tag_organizationId_idx" ON "public"."file_tag"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "file_tag_organizationId_name_key" ON "public"."file_tag"("organizationId", "name");

-- CreateIndex
CREATE INDEX "file_to_tag_tagId_idx" ON "public"."file_to_tag"("tagId");

-- AddForeignKey
ALTER TABLE "public"."file" ADD CONSTRAINT "file_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file" ADD CONSTRAINT "file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_tag" ADD CONSTRAINT "file_tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_to_tag" ADD CONSTRAINT "file_to_tag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_to_tag" ADD CONSTRAINT "file_to_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."file_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security on file management tables
-- Since this application uses Prisma (which connects via service role), it bypasses RLS.
-- By enabling RLS without creating any policies, we effectively deny all access
-- to these tables via PostgREST while allowing Prisma/service role full access.

-- Enable RLS on file table (uploaded files tracking)
ALTER TABLE "public"."file" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on file_tag table (file tags)
ALTER TABLE "public"."file_tag" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on file_to_tag table (file-tag associations)
ALTER TABLE "public"."file_to_tag" ENABLE ROW LEVEL SECURITY;
