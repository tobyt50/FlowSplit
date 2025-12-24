-- 1. Add the new columns as NULLABLE first (so we don't break existing rows)
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- 2. Migrate Data: Split 'fullName' into 'firstName' and 'lastName'
-- Logic: Everything before the first space is First Name, everything after is Last Name.
UPDATE "User"
SET 
  "firstName" = split_part("fullName", ' ', 1),
  "lastName" = substring("fullName" from position(' ' in "fullName") + 1);

-- 3. Handle Edge Cases (Users with no spaces in name)
-- If lastName ended up NULL or empty, set it to a placeholder or empty string
UPDATE "User" SET "lastName" = '' WHERE "lastName" IS NULL OR "lastName" = '';

-- 4. Now that data is filled, enforce NOT NULL constraint
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;

-- 5. Finally, safe to drop the old column
ALTER TABLE "User" DROP COLUMN "fullName";