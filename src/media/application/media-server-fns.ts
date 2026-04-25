import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { isSessionExpired, SESSION_COOKIE_NAME } from "@/auth/domain/session";
import { getById as getSessionById } from "@/auth/infrastructure/d1-session-repository";
import {
	createMediaItemSchema,
	mediaSearchSchema,
	updateMediaItemSchema,
} from "../domain/media-item";
import {
	createMediaItem,
	deleteMediaItem,
	searchMediaItems,
	updateMediaItem,
} from "../infrastructure/d1-media-repository";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireUser(db: D1Database): Promise<string> {
	const sessionId = getCookie(SESSION_COOKIE_NAME);
	if (!sessionId) throw new Error("Not authenticated");
	const session = await getSessionById(db, sessionId);
	if (!session || isSessionExpired(session)) throw new Error("Session expired");
	return session.userEmail;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export const searchMediaFn = createServerFn({ method: "GET" })
	.inputValidator(mediaSearchSchema)
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		return searchMediaItems(db, data);
	});

// ── Write ─────────────────────────────────────────────────────────────────────

export const createMediaItemFn = createServerFn({ method: "POST" })
	.inputValidator(createMediaItemSchema)
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const userEmail = await requireUser(db);
		return createMediaItem(db, data, userEmail);
	});

export const updateMediaItemFn = createServerFn({ method: "POST" })
	.inputValidator(updateMediaItemSchema)
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await requireUser(db);
		await updateMediaItem(db, data);
	});

export const deleteMediaItemFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await requireUser(db);
		await deleteMediaItem(db, data.id);
	});
