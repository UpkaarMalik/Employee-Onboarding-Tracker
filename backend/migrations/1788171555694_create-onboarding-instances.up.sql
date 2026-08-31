-- Write your UP migration here
CREATE TABLE onboarding_instances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id       UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE RESTRICT,
  template_version  INTEGER NOT NULL,

  status            VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','IN_PROGRESS','COMPLETED','CANCELLED')),

  version           INTEGER NOT NULL DEFAULT 1,

  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,

  feedback_rating           INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comments         TEXT,
  feedback_submitted_at     TIMESTAMPTZ,

  created_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (employee_id)
);

CREATE INDEX idx_instances_employee ON onboarding_instances(employee_id);
CREATE INDEX idx_instances_status ON onboarding_instances(status);