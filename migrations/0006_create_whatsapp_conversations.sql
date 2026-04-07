CREATE TABLE whatsapp_conversations (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  -- States: awaiting_approval | implementing | awaiting_ship | done
  state TEXT NOT NULL DEFAULT 'awaiting_approval',
  feature_request TEXT NOT NULL,
  plan TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  branch_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_whatsapp_conversations_phone_active
  ON whatsapp_conversations(phone_number, state)
  WHERE state != 'done';
