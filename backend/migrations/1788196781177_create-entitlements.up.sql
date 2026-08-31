-- Write your UP migration here
CREATE TABLE entitlements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  category      VARCHAR(30) NOT NULL
                CHECK (category IN ('INSURANCE','DEVICE','PERK','OTHER')),
  is_active     BOOLEAN NOT NULL DEFAULT true
);
