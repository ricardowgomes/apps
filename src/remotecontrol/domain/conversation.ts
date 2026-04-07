export type ConversationState =
	| "awaiting_approval"
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

export interface Plan {
	title: string;
	steps: string[];
	effort: "S" | "M" | "L";
	branch: string;
	raw: string;
}

/** Returns true if the message is an affirmative approval */
export function isApproval(text: string): boolean {
	return /^(yes|y|si|ok|approve[d]?|go|lgtm|👍)$/i.test(text.trim());
}

/** Returns true if the message is a cancellation */
export function isCancellation(text: string): boolean {
	return /^(no|cancel|stop|abort|nope|👎)$/i.test(text.trim());
}

/** Returns true if the message is a ship command */
export function isShipCommand(text: string): boolean {
	return /^(ship|merge|deploy|go|yes|y|ok|do it)$/i.test(text.trim());
}
