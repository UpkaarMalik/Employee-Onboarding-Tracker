-- Write your UP migration here
CREATE TABLE resources (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  category          VARCHAR(30) NOT NULL
                    CHECK (category IN ('POLICY','HANDBOOK','PLAYBOOK','LEARNING')),
  file_url          VARCHAR(500) NOT NULL,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_downloadable   BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_resources_department ON resources(department_id);
CREATE INDEX idx_resources_category ON resources(category);