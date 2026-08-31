-- Write your UP migration here
CREATE TABLE content_gallery (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          VARCHAR(20) NOT NULL
                CHECK (type IN ('COMPANY_FAMILY', 'SPORTS')),
  title         VARCHAR(150),
  description   TEXT,
  image_url     VARCHAR(500) NOT NULL,
  uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_gallery_type ON content_gallery(type);
