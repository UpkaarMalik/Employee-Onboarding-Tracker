-- Write your UP migration here
CREATE TABLE users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name               VARCHAR(150) NOT NULL,
  mobile                  VARCHAR(20),
  dob                     DATE,
  address                 TEXT,

  personal_email          VARCHAR(150) UNIQUE NOT NULL,
  temp_email              VARCHAR(150) UNIQUE,
  email                   VARCHAR(150) UNIQUE,
  pending_official_email  VARCHAR(150),
  is_temp_email_active    BOOLEAN NOT NULL DEFAULT true,

  password_hash           VARCHAR(255) NOT NULL,
  must_change_password    BOOLEAN NOT NULL DEFAULT true,

  role                    VARCHAR(20) NOT NULL
                          CHECK (role IN ('SUPER_ADMIN','ADMIN','HR','EMPLOYEE')),

  department_id           UUID REFERENCES departments(id) ON DELETE SET NULL,

  profile_picture_url     VARCHAR(500),
  joining_date            DATE,
  is_active               BOOLEAN NOT NULL DEFAULT true,

  version                 INTEGER NOT NULL DEFAULT 1,

  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_email_state CHECK (
    (is_temp_email_active = true  AND temp_email IS NOT NULL) OR
    (is_temp_email_active = false AND email IS NOT NULL)
  )
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_temp_email ON users(temp_email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_personal_email ON users(personal_email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();