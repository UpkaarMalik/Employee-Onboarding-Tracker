-- Write your DOWN migration here
DELETE FROM resources WHERE file_url LIKE '/seed-placeholder/%';
