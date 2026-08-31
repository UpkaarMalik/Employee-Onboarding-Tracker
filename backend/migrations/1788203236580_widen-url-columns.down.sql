-- Write your DOWN migration here
ALTER TABLE content_gallery ALTER COLUMN image_url TYPE VARCHAR(500);
ALTER TABLE resources ALTER COLUMN file_url TYPE VARCHAR(500);
ALTER TABLE users ALTER COLUMN profile_picture_url TYPE VARCHAR(500);
