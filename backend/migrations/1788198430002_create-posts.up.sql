-- Write your UP migration here
CREATE TABLE posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content             TEXT NOT NULL,
  status              VARCHAR(10) NOT NULL DEFAULT 'VISIBLE'
                      CHECK (status IN ('VISIBLE', 'HIDDEN')),
  moderation_reason   TEXT,
  moderated_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE post_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction    VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
