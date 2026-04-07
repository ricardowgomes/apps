import { chat } from "@tanstack/ai";
import { AnthropicTextAdapter } from "@tanstack/ai-anthropic";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { isSessionExpired, SESSION_COOKIE_NAME } from "@/auth/domain/session";
import { getById as getSessionById } from "@/auth/infrastructure/d1-session-repository";
import { generatedStorySchema } from "../domain/story";
import {
	deleteStory,
	getAllStories,
	getStoryById,
	saveGeneratedStory,
} from "../infrastructure/d1-story-repository";

// ── Read ─────────────────────────────────────────────────────────────────────

export const getStoriesFn = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		const db = context.cloudflare.env.DB;
		return getAllStories(db);
	},
);

export const getStoryFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storyId: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		return getStoryById(db, data.storyId);
	});

// ── Generate ─────────────────────────────────────────────────────────────────

export const generateStoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ prompt: z.string().min(1).max(500) }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const apiKey = context.cloudflare.env.ANTHROPIC_API_KEY;
		if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

		// Resolve current user from session cookie
		const sessionId = getCookie(SESSION_COOKIE_NAME);
		if (!sessionId) throw new Error("Not authenticated");
		const session = await getSessionById(db, sessionId);
		if (!session || isSessionExpired(session))
			throw new Error("Session expired");

		// Use @tanstack/ai with the Anthropic adapter for structured story generation
		const adapter = new AnthropicTextAdapter({ apiKey }, "claude-3-5-haiku");

		const story = await chat({
			adapter,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							content: `You are a creative children's book author. Write a short illustrated story based on this idea:

"${data.prompt}"

Guidelines:
- 4-5 scenes, each with 2-4 sentences of warm, engaging narrative text
- Language suitable for children aged 4-10
- Each scene should have a vivid image prompt for a children's book watercolour illustration
- The story should have a clear beginning, middle, and end
- Keep it magical, positive, and heartwarming`,
						},
					],
				},
			],
			outputSchema: generatedStorySchema,
		});

		const storyId = await saveGeneratedStory(db, story, session.userEmail);

		return { storyId, story };
	});

// ── Delete ───────────────────────────────────────────────────────────────────

export const deleteStoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ storyId: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await deleteStory(db, data.storyId);
	});
