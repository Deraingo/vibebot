CREATE TABLE IF NOT EXISTS quotes (
  id            SERIAL PRIMARY KEY,
  channel_id    TEXT NOT NULL,
  quote_number  INTEGER NOT NULL,
  quote_text    TEXT NOT NULL,
  added_by      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, quote_number)
);