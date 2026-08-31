-- Write your UP migration here
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_type    VARCHAR(50) NOT NULL
               CHECK (event_type IN (
                 'ROLE_CHANGED',
                 'PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN',
                 'TASK_STATUS_CHANGED',
                 'TASK_REASSIGNED',
                 'TEMPLATE_UPDATED',
                 'EMAIL_TRANSFORMED',
                 'CSV_EXPORTED'
               )),
  target_type   VARCHAR(50),
  target_id     UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;