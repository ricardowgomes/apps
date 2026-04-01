import { describe, expect, it } from "vitest";
import type { Session } from "../session";
import {
	isSessionExpired,
	SESSION_COOKIE_NAME,
	SESSION_DURATION_MS,
	sessionToUser,
} from "../session";

function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "sess-123",
		userEmail: "user@example.com",
		userName: "Test User",
		userAvatar: "https://example.com/avatar.jpg",
		expiresAt: new Date(Date.now() + 60_000).toISOString(), // 1 min from now
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

describe("isSessionExpired", () => {
	it("returns false for a session that expires in the future", () => {
		const session = makeSession();
		expect(isSessionExpired(session)).toBe(false);
	});

	it("returns true for a session that has already expired", () => {
		const session = makeSession({
			expiresAt: new Date(Date.now() - 1000).toISOString(),
		});
		expect(isSessionExpired(session)).toBe(true);
	});

	it("returns true for a session expiring exactly at the current moment (boundary)", () => {
		// expiresAt <= now → expired
		const past = new Date(Date.now() - 1).toISOString();
		const session = makeSession({ expiresAt: past });
		expect(isSessionExpired(session)).toBe(true);
	});
});

describe("sessionToUser", () => {
	it("maps session fields to SessionUser", () => {
		const session = makeSession();
		const user = sessionToUser(session);
		expect(user).toEqual({
			email: "user@example.com",
			name: "Test User",
			avatar: "https://example.com/avatar.jpg",
		});
	});

	it("preserves null userName and userAvatar", () => {
		const session = makeSession({ userName: null, userAvatar: null });
		const user = sessionToUser(session);
		expect(user.name).toBeNull();
		expect(user.avatar).toBeNull();
	});
});

describe("constants", () => {
	it("SESSION_COOKIE_NAME is session_id", () => {
		expect(SESSION_COOKIE_NAME).toBe("session_id");
	});

	it("SESSION_DURATION_MS is 30 days in milliseconds", () => {
		expect(SESSION_DURATION_MS).toBe(30 * 24 * 60 * 60 * 1000);
	});
});
