-- Write your UP migration here
CREATE TABLE template_tasks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id             UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,

  title                   VARCHAR(200) NOT NULL,
  description             TEXT,

  task_type               VARCHAR(20) NOT NULL
                          CHECK (task_type IN ('ACTION','READING')),

  order_index             INTEGER NOT NULL,

  owner_type              VARCHAR(20) NOT NULL
                          CHECK (owner_type IN ('EMPLOYEE','HR','DEPARTMENT_ADMIN')),

  is_required             BOOLEAN NOT NULL DEFAULT true,

  depends_on_order_index  INTEGER,

  resource_id             UUID REFERENCES resources(id) ON DELETE SET NULL,

  UNIQUE (template_id, order_index)
);

CREATE INDEX idx_template_tasks_template ON template_tasks(template_id);