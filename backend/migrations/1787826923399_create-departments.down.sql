-- NOTE: pgcrypto extension and set_updated_at() function are shared
-- infrastructure used by other tables — intentionally NOT dropped here,
-- since rolling back this one migration shouldn't break every other table.
DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
DROP TABLE IF EXISTS departments;