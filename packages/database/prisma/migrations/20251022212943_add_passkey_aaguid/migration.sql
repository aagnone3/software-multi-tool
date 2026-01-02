-- Acquire an advisory lock in a transaction
BEGIN;
SELECT pg_advisory_lock(4189800204::bigint);

-- AlterTable
ALTER TABLE "passkey" ADD COLUMN     "aaguid" TEXT;

-- Release the advisory lock and commit the transaction
SELECT pg_advisory_unlock(4189800204::bigint);
COMMIT;
