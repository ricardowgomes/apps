CREATE TABLE IF NOT EXISTS stories (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	cover_image_url TEXT,
	created_by TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenes (
	id TEXT PRIMARY KEY,
	story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
	"order" INTEGER NOT NULL,
	text TEXT NOT NULL,
	image_prompt TEXT NOT NULL,
	image_url TEXT,
	created_at TEXT NOT NULL
);
