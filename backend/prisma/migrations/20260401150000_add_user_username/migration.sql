ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "username" TEXT;

UPDATE "User"
SET "username" = CONCAT('user_', "id")
WHERE "username" IS NULL OR "username" = '';

ALTER TABLE "User"
ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key"
ON "User"("username");
