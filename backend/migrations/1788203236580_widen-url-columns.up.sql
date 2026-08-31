-- Write your UP migration here
-- VARCHAR(500) was sized for a hosted URL; widen to TEXT so a data: URI
-- (or a long signed cloud-storage URL) never overflows the column.
ALTER TABLE content_gallery ALTER COLUMN image_url TYPE TEXT;
ALTER TABLE resources ALTER COLUMN file_url TYPE TEXT;
ALTER TABLE users ALTER COLUMN profile_picture_url TYPE TEXT;
