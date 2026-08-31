-- Write your UP migration here
CREATE TABLE onboarding_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id  UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  name           VARCHAR(150) NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (department_id, version)
);

CREATE INDEX idx_templates_department ON onboarding_templates(department_id);
CREATE INDEX idx_templates_active ON onboarding_templates(is_active) WHERE is_active = true;