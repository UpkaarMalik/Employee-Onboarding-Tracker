-- Write your UP migration here
CREATE TABLE task_status_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_status   VARCHAR(20),
  to_status     VARCHAR(20) NOT NULL,
  changed_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_task ON task_status_history(task_id);

REVOKE UPDATE, DELETE ON task_status_history FROM PUBLIC;