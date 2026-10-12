-- Drop the googleFormUrl column from Position table
-- Form links are now derived as {FRONTEND_URL}/apply/:positionId
ALTER TABLE "Position" DROP COLUMN IF EXISTS "googleFormUrl";
