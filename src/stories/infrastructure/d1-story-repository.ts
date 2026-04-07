import type {
	GeneratedStory,
	Scene,
	Story,
	StorySummary,
} from "../domain/story";

// ── Row types returned from D1 ───────────────────────────────────────────────

interface StoryRow {
	id: string;
	title: string;
	cover_image_url: string | null;
	created_by: string;
	created_at: string;
}

interface SceneRow {
	id: string;
	story_id: string;
	order: number;
	text: string;
	image_prompt: string;
	image_url: string | null;
	created_at: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function rowToScene(row: SceneRow): Scene {
	return {
		id: row.id,
		storyId: row.story_id,
		order: row.order,
		text: row.text,
		imagePrompt: row.image_prompt,
		imageUrl: row.image_url,
	};
}

function rowToSummary(row: StoryRow & { scene_count: number }): StorySummary {
	return {
		id: row.id,
		title: row.title,
		coverImageUrl: row.cover_image_url,
		createdAt: new Date(row.created_at),
		createdBy: row.created_by,
		sceneCount: row.scene_count,
	};
}

// ── Repository ───────────────────────────────────────────────────────────────

export async function getAllStories(db: D1Database): Promise<StorySummary[]> {
	const result = await db
		.prepare(
			`SELECT s.*, COUNT(sc.id) as scene_count
       FROM stories s
       LEFT JOIN scenes sc ON sc.story_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
		)
		.all<StoryRow & { scene_count: number }>();

	return (result.results ?? []).map(rowToSummary);
}

export async function getStoryById(
	db: D1Database,
	id: string,
): Promise<Story | null> {
	const storyRow = await db
		.prepare("SELECT * FROM stories WHERE id = ?")
		.bind(id)
		.first<StoryRow>();

	if (!storyRow) return null;

	const scenesResult = await db
		.prepare(`SELECT * FROM scenes WHERE story_id = ? ORDER BY "order" ASC`)
		.bind(id)
		.all<SceneRow>();

	return {
		id: storyRow.id,
		title: storyRow.title,
		coverImageUrl: storyRow.cover_image_url,
		createdAt: new Date(storyRow.created_at),
		createdBy: storyRow.created_by,
		scenes: (scenesResult.results ?? []).map(rowToScene),
	};
}

export async function saveGeneratedStory(
	db: D1Database,
	generated: GeneratedStory,
	createdBy: string,
): Promise<string> {
	const storyId = crypto.randomUUID();
	const now = new Date().toISOString();

	await db
		.prepare(
			"INSERT INTO stories (id, title, cover_image_url, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
		)
		.bind(storyId, generated.title, null, createdBy, now)
		.run();

	const insertScene = db.prepare(
		`INSERT INTO scenes (id, story_id, "order", text, image_prompt, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
	);

	await db.batch(
		generated.scenes.map((scene, i) =>
			insertScene.bind(
				crypto.randomUUID(),
				storyId,
				i,
				scene.text,
				scene.imagePrompt,
				null,
				now,
			),
		),
	);

	return storyId;
}

export async function deleteStory(db: D1Database, id: string): Promise<void> {
	await db.prepare("DELETE FROM stories WHERE id = ?").bind(id).run();
}
