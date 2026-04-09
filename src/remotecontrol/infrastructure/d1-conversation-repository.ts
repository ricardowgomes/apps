import type {
	Conversation,
	ConversationState,
	Message,
} from "../domain/conversation";

interface D1ConversationRow {
	id: string;
	phone_number: string;
	state: ConversationState;
	feature_request: string;
	plan: string | null;
	pr_url: string | null;
	pr_number: number | null;
	branch_name: string | null;
	created_at: string;
	updated_at: string;
}

interface D1MessageRow {
	id: string;
	conversation_id: string;
	role: "user" | "assistant";
	content: string;
	created_at: string;
}

function rowToConversation(row: D1ConversationRow): Conversation {
	return {
		id: row.id,
		phoneNumber: row.phone_number,
		state: row.state,
		featureRequest: row.feature_request,
		plan: row.plan,
		prUrl: row.pr_url,
		prNumber: row.pr_number,
		branchName: row.branch_name,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function rowToMessage(row: D1MessageRow): Message {
	return {
		id: row.id,
		conversationId: row.conversation_id,
		role: row.role,
		content: row.content,
		createdAt: row.created_at,
	};
}

/** Find the most recent active (non-done) conversation for a chat */
export async function findActive(
	db: D1Database,
	phoneNumber: string,
): Promise<Conversation | null> {
	const row = await db
		.prepare(
			`SELECT * FROM whatsapp_conversations
       WHERE phone_number = ? AND state != 'done'
       ORDER BY created_at DESC LIMIT 1`,
		)
		.bind(phoneNumber)
		.first<D1ConversationRow>();
	return row ? rowToConversation(row) : null;
}

/** Find a conversation by its ID */
export async function findById(
	db: D1Database,
	id: string,
): Promise<Conversation | null> {
	const row = await db
		.prepare("SELECT * FROM whatsapp_conversations WHERE id = ?")
		.bind(id)
		.first<D1ConversationRow>();
	return row ? rowToConversation(row) : null;
}

/** Find conversations stuck in 'implementing' for longer than thresholdMinutes */
export async function findStuck(
	db: D1Database,
	thresholdMinutes: number,
): Promise<Conversation[]> {
	const rows = await db
		.prepare(
			`SELECT * FROM whatsapp_conversations
       WHERE state = 'implementing'
         AND updated_at < datetime('now', ? || ' minutes')
       ORDER BY updated_at ASC`,
		)
		.bind(`-${thresholdMinutes}`)
		.all<D1ConversationRow>();
	return rows.results.map(rowToConversation);
}

/** Create a new conversation in the active state */
export async function create(
	db: D1Database,
	conversation: Pick<
		Conversation,
		"id" | "phoneNumber" | "featureRequest" | "plan"
	>,
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO whatsapp_conversations
         (id, phone_number, state, feature_request, plan, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, datetime('now'), datetime('now'))`,
		)
		.bind(
			conversation.id,
			conversation.phoneNumber,
			conversation.featureRequest,
			conversation.plan ?? null,
		)
		.run();
}

/** Update the plan text (stays in active state) */
export async function updatePlan(
	db: D1Database,
	id: string,
	plan: string,
): Promise<void> {
	await db
		.prepare(
			`UPDATE whatsapp_conversations
       SET plan = ?, updated_at = datetime('now')
       WHERE id = ?`,
		)
		.bind(plan, id)
		.run();
}

/** Transition state, optionally setting branch name / PR details */
export async function updateState(
	db: D1Database,
	id: string,
	state: ConversationState,
	extra: { branchName?: string; prUrl?: string; prNumber?: number } = {},
): Promise<void> {
	await db
		.prepare(
			`UPDATE whatsapp_conversations
       SET state = ?,
           branch_name = COALESCE(?, branch_name),
           pr_url = COALESCE(?, pr_url),
           pr_number = COALESCE(?, pr_number),
           updated_at = datetime('now')
       WHERE id = ?`,
		)
		.bind(
			state,
			extra.branchName ?? null,
			extra.prUrl ?? null,
			extra.prNumber ?? null,
			id,
		)
		.run();
}

// ── Message history ───────────────────────────────────────────────────────

/** Persist a single message turn */
export async function saveMessage(
	db: D1Database,
	conversationId: string,
	role: "user" | "assistant",
	content: string,
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO telegram_messages (id, conversation_id, role, content, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
		)
		.bind(crypto.randomUUID(), conversationId, role, content)
		.run();
}

/** Retrieve the last N messages for a conversation, oldest-first */
export async function getMessages(
	db: D1Database,
	conversationId: string,
	limit = 20,
): Promise<Message[]> {
	const rows = await db
		.prepare(
			`SELECT * FROM (
         SELECT * FROM telegram_messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC
         LIMIT ?
       ) ORDER BY created_at ASC`,
		)
		.bind(conversationId, limit)
		.all<D1MessageRow>();
	return rows.results.map(rowToMessage);
}

// ── Deduplication ─────────────────────────────────────────────────────────

/** Return the last processed Telegram update_id for a chat (0 if never seen) */
export async function getLastUpdateId(
	db: D1Database,
	chatId: string,
): Promise<number> {
	const row = await db
		.prepare("SELECT last_update_id FROM telegram_chat_state WHERE chat_id = ?")
		.bind(chatId)
		.first<{ last_update_id: number }>();
	return row?.last_update_id ?? 0;
}

/** Upsert the last processed update_id for a chat */
export async function setLastUpdateId(
	db: D1Database,
	chatId: string,
	updateId: number,
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO telegram_chat_state (chat_id, last_update_id, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(chat_id) DO UPDATE SET
         last_update_id = excluded.last_update_id,
         updated_at = excluded.updated_at`,
		)
		.bind(chatId, updateId)
		.run();
}
