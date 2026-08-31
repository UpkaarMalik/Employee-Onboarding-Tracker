-- Write your UP migration here
CREATE TABLE private_notes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                     VARCHAR(200),
  content_json              JSONB NOT NULL,
  content_html_sanitized    TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_private_notes_employee ON private_notes(employee_id);
