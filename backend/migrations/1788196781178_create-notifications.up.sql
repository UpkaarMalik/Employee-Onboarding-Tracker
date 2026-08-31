-- Write your UP migration here
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  message       TEXT,
  type          VARCHAR(30) NOT NULL
                CHECK (type IN ('TASK_ASSIGNED','TASK_WAITING','ONBOARDING_STARTED','ONBOARDING_COMPLETED')),
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
