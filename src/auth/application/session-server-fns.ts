import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { SessionUser } from "../domain/session";
import {
	isSessionExpired,
	SESSION_COOKIE_NAME,
	sessionToUser,
} from "../domain/session";
import { getById } from "../infrastructure/d1-session-repository";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async ({ context }): Promise<SessionUser | null> => {
		const sessionId = getCookie(SESSION_COOKIE_NAME);
		if (!sessionId) return null;

		const db = context.cloudflare.env.DB;
		const session = await getById(db, sessionId);

		if (!session || isSessionExpired(session)) return null;

		return sessionToUser(session);
	},
);
