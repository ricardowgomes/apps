import type { Session } from "../domain/session";

interface D1SessionRow {
	id: string;
	user_email: string;
	user_name: string | null;
	user_avatar: string | null;
	expires_at: string;
	created_at: string;
}

function rowToSession(row: D1SessionRow): Session {
	return {
		id: row.id,
		userEmail: row.user_email,
		userName: row.user_name,
		userAvatar: row.user_avatar,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
	};
}

export async function getById(
	db: D1Database,
	id: string,
): Promise<Session | null> {
	const row = await db
		.prepare("SELECT * FROM sessions WHERE id = ?")
		.bind(id)
		.first<D1SessionRow>();
	return row ? rowToSession(row) : null;
}

export async function insert(db: D1Database, session: Session): Promise<void> {
	await db
		.prepare(
			`INSERT INTO sessions (id, user_email, user_name, user_avatar, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			session.id,
			session.userEmail,
			session.userName,
			session.userAvatar,
			session.expiresAt,
			session.createdAt,
		)
		.run();
}

export async function deleteById(db: D1Database, id: string): Promise<void> {
	await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

/** @internal Planned for auth session cleanup cron job — not wired up yet. */
export async function deleteExpiredSessions(db: D1Database): Promise<void> {
	await db
		.prepare("DELETE FROM sessions WHERE expires_at < ?")
		.bind(new Date().toISOString())
		.run();
}
