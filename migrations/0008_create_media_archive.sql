CREATE TABLE IF NOT EXISTS media_items (
	id TEXT PRIMARY KEY,
	type TEXT NOT NULL CHECK(type IN ('movie', 'tv_show', 'music')),
	title TEXT NOT NULL,
	description TEXT,
	year INTEGER,
	poster_url TEXT,
	status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog', 'in_progress', 'done')),
	rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
	notes TEXT,
	-- Shared metadata (JSON arrays stored as text)
	genres TEXT NOT NULL DEFAULT '[]',
	-- Movie / TV specific
	directors TEXT NOT NULL DEFAULT '[]',
	cast_members TEXT NOT NULL DEFAULT '[]',
	-- Music specific
	artists TEXT NOT NULL DEFAULT '[]',
	album TEXT,
	-- Ownership
	added_by TEXT NOT NULL,
	added_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_added_by ON media_items(added_by);
