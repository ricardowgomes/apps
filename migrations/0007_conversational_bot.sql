-- Rename awaiting_approval state → active (broader: covers chat, clarify, and plan review)
UPDATE whatsapp_conversations SET state = 'active' WHERE state = 'awaiting_approval';

-- Conversation message history — used to give the LLM full context on each turn
CREATE TABLE telegram_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES whatsapp_conversations(id),
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_telegram_messages_conv
  ON telegram_messages(conversation_id, created_at);

-- Per-chat deduplication state — prevents Telegram webhook retries from double-processing
CREATE TABLE telegram_chat_state (
  chat_id TEXT PRIMARY KEY,
  last_update_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
