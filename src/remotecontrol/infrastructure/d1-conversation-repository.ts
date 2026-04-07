import type { Conversation, ConversationState } from "../domain/conversation";

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

/** Find the most recent active (non-done) conversation for a phone number */
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

/** Create a new conversation in the awaiting_approval state */
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
       VALUES (?, ?, 'awaiting_approval', ?, ?, datetime('now'), datetime('now'))`,
		)
		.bind(
			conversation.id,
			conversation.phoneNumber,
			conversation.featureRequest,
			conversation.plan ?? null,
		)
		.run();
}

/** Update the plan text (while staying in awaiting_approval) */
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

/** Transition state, optionally setting branch name */
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
