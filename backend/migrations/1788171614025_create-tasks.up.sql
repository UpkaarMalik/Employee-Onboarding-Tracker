-- Write your UP migration here
CREATE TABLE tasks (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id    UUID NOT NULL REFERENCES onboarding_instances(id) ON DELETE CASCADE,
  template_task_id          UUID REFERENCES template_tasks(id) ON DELETE SET NULL,

  title                     VARCHAR(200) NOT NULL,
  description               TEXT,

  task_type                 VARCHAR(20) NOT NULL
                            CHECK (task_type IN ('ACTION','READING')),

  order_index               INTEGER NOT NULL,

  owner_type                VARCHAR(20) NOT NULL
                            CHECK (owner_type IN ('EMPLOYEE','HR','DEPARTMENT_ADMIN')),
  owner_id                  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  is_required               BOOLEAN NOT NULL DEFAULT true,

  depends_on_task_id        UUID REFERENCES tasks(id) ON DELETE SET NULL,

  status                    VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','AVAILABLE','IN_PROGRESS','COMPLETED')),

  reading_total_active_seconds  INTEGER DEFAULT 0 CHECK (reading_total_active_seconds >= 0),
  reading_last_heartbeat_at     TIMESTAMPTZ,
  reading_status                VARCHAR(20)
                                CHECK (reading_status IN ('IN_PROGRESS','COMPLETED','DISCARDED')),

  version                   INTEGER NOT NULL DEFAULT 1,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (onboarding_instance_id, order_index),

  CONSTRAINT chk_reading_cols_scoped CHECK (
    task_type = 'READING' OR (
      reading_total_active_seconds = 0 AND
      reading_last_heartbeat_at IS NULL AND
      reading_status IS NULL
    )
  )
);

CREATE INDEX idx_tasks_instance ON tasks(onboarding_instance_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_depends_on ON tasks(depends_on_task_id);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();