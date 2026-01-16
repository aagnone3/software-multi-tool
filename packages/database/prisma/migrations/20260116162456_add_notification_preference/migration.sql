-- CreateTable
CREATE TABLE "public"."notification_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billing" JSONB NOT NULL DEFAULT '{"inApp": true, "email": true}',
    "security" JSONB NOT NULL DEFAULT '{"inApp": true, "email": true}',
    "team" JSONB NOT NULL DEFAULT '{"inApp": true, "email": true}',
    "system" JSONB NOT NULL DEFAULT '{"inApp": true, "email": false}',

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_key" ON "public"."notification_preference"("userId");

-- AddForeignKey
ALTER TABLE "public"."notification_preference" ADD CONSTRAINT "notification_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
