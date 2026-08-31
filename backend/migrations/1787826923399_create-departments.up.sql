-- Write your UP migration here


-- Write your DOWN migration here
-- Shared infrastructure (defined once, here, since this is the first real migration)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Departments table
CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  code          VARCHAR(20) NOT NULL UNIQUE,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed data (departments are reference data, safe to seed directly in the migration)
INSERT INTO departments (name, code, description) VALUES
  ('Engineering', 'ENG', 'Product and platform engineering'),
  ('Sales', 'SALES', 'Revenue and client acquisition'),
  ('Marketing Ops', 'MKT_OPS', 'Marketing operations and growth'),
  ('Finance', 'FIN', 'Financial planning, accounting and operations');