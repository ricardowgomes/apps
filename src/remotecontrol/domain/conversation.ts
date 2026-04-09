export type ConversationState =
	| "active"
	| "implementing"
	| "awaiting_ship"
	| "done";

export interface Conversation {
	id: string;
	phoneNumber: string;
	state: ConversationState;
	featureRequest: string;
	plan: string | null;
	prUrl: string | null;
	prNumber: number | null;
	branchName: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	conversationId: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
}

/** Returns true if the message is a ship/merge command */
export function isShipCommand(text: string): boolean {
	return /^(ship|merge|deploy)$/i.test(text.trim());
}

/** Returns true if the message is a cancellation — works from any state */
export function isCancelCommand(text: string): boolean {
	return /\b(cancel|stop|abort)\b/i.test(text.trim());
}
