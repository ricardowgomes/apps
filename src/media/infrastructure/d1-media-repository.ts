import type {
	CreateMediaItemInput,
	MediaItem,
	MediaSearchParams,
	MediaStatus,
	MediaType,
	UpdateMediaItemInput,
} from "../domain/media-item";

// ── Row type ──────────────────────────────────────────────────────────────────

interface MediaItemRow {
	id: string;
	type: MediaType;
	title: string;
	description: string | null;
	year: number | null;
	poster_url: string | null;
	status: MediaStatus;
	rating: number | null;
	notes: string | null;
	genres: string;
	directors: string;
	cast_members: string;
	artists: string;
	album: string | null;
	added_by: string;
	added_at: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function rowToItem(row: MediaItemRow): MediaItem {
	return {
		id: row.id,
		type: row.type,
		title: row.title,
		description: row.description,
		year: row.year,
		posterUrl: row.poster_url,
		status: row.status,
		rating: row.rating,
		notes: row.notes,
		genres: JSON.parse(row.genres),
		directors: JSON.parse(row.directors),
		castMembers: JSON.parse(row.cast_members),
		artists: JSON.parse(row.artists),
		album: row.album,
		addedBy: row.added_by,
		addedAt: new Date(row.added_at),
	};
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function searchMediaItems(
	db: D1Database,
	params: MediaSearchParams,
): Promise<MediaItem[]> {
	const conditions: string[] = [];
	const bindings: (string | number)[] = [];

	if (params.query) {
		conditions.push("title LIKE ?");
		bindings.push(`%${params.query}%`);
	}

	if (params.type) {
		conditions.push("type = ?");
		bindings.push(params.type);
	}

	if (params.status) {
		conditions.push("status = ?");
		bindings.push(params.status);
	}

	// Tag-based connection filter — finds items where a JSON array column
	// contains a specific value (the "connections" feature).
	if (params.tag && params.tagField) {
		conditions.push(
			`EXISTS (SELECT 1 FROM json_each(${params.tagField}) WHERE value = ?)`,
		);
		bindings.push(params.tag);
	}

	const where =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const sql = `SELECT * FROM media_items ${where} ORDER BY added_at DESC`;

	const result = await db
		.prepare(sql)
		.bind(...bindings)
		.all<MediaItemRow>();

	return (result.results ?? []).map(rowToItem);
}

export async function createMediaItem(
	db: D1Database,
	input: CreateMediaItemInput,
	addedBy: string,
): Promise<string> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	await db
		.prepare(
			`INSERT INTO media_items
				(id, type, title, description, year, poster_url, status, rating, notes,
				 genres, directors, cast_members, artists, album, added_by, added_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			id,
			input.type,
			input.title,
			input.description ?? null,
			input.year ?? null,
			input.posterUrl ?? null,
			input.status ?? "backlog",
			input.rating ?? null,
			input.notes ?? null,
			JSON.stringify(input.genres ?? []),
			JSON.stringify(input.directors ?? []),
			JSON.stringify(input.castMembers ?? []),
			JSON.stringify(input.artists ?? []),
			input.album ?? null,
			addedBy,
			now,
		)
		.run();

	return id;
}

export async function updateMediaItem(
	db: D1Database,
	input: UpdateMediaItemInput,
): Promise<void> {
	const setClauses: string[] = [];
	const bindings: (string | number | null)[] = [];

	if (input.type !== undefined) {
		setClauses.push("type = ?");
		bindings.push(input.type);
	}
	if (input.title !== undefined) {
		setClauses.push("title = ?");
		bindings.push(input.title);
	}
	if ("description" in input) {
		setClauses.push("description = ?");
		bindings.push(input.description ?? null);
	}
	if ("year" in input) {
		setClauses.push("year = ?");
		bindings.push(input.year ?? null);
	}
	if ("posterUrl" in input) {
		setClauses.push("poster_url = ?");
		bindings.push(input.posterUrl ?? null);
	}
	if (input.status !== undefined) {
		setClauses.push("status = ?");
		bindings.push(input.status);
	}
	if ("rating" in input) {
		setClauses.push("rating = ?");
		bindings.push(input.rating ?? null);
	}
	if ("notes" in input) {
		setClauses.push("notes = ?");
		bindings.push(input.notes ?? null);
	}
	if (input.genres !== undefined) {
		setClauses.push("genres = ?");
		bindings.push(JSON.stringify(input.genres));
	}
	if (input.directors !== undefined) {
		setClauses.push("directors = ?");
		bindings.push(JSON.stringify(input.directors));
	}
	if (input.castMembers !== undefined) {
		setClauses.push("cast_members = ?");
		bindings.push(JSON.stringify(input.castMembers));
	}
	if (input.artists !== undefined) {
		setClauses.push("artists = ?");
		bindings.push(JSON.stringify(input.artists));
	}
	if ("album" in input) {
		setClauses.push("album = ?");
		bindings.push(input.album ?? null);
	}

	if (setClauses.length === 0) return;

	bindings.push(input.id);
	await db
		.prepare(`UPDATE media_items SET ${setClauses.join(", ")} WHERE id = ?`)
		.bind(...bindings)
		.run();
}

export async function deleteMediaItem(
	db: D1Database,
	id: string,
): Promise<void> {
	await db.prepare("DELETE FROM media_items WHERE id = ?").bind(id).run();
}
