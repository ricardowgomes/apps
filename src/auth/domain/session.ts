export interface Session {
	id: string;
	userEmail: string;
	userName: string | null;
	userAvatar: string | null;
	expiresAt: string; // ISO 8601
	createdAt: string; // ISO 8601
}

export interface SessionUser {
	email: string;
	name: string | null;
	avatar: string | null;
}

export const SESSION_COOKIE_NAME = "session_id";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isSessionExpired(session: Session): boolean {
	return new Date(session.expiresAt) <= new Date();
}

export function sessionToUser(session: Session): SessionUser {
	return {
		email: session.userEmail,
		name: session.userName,
		avatar: session.userAvatar,
	};
}
