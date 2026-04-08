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

// ── Story pre-prompt ─────────────────────────────────────────────────────────

/**
 * Standing persona and rules for every story generation call.
 * The user's idea is polished in buildStoryPrompt() before being sent here.
 */
const STORY_SYSTEM_PROMPT = `\
You are a warm, imaginative children's book author writing illustrated graphic-novel-style stories \
for a 4-year-old girl named Sofia.

STYLE & FORMAT
- Graphic novel presentation: each scene is a single vivid panel with bold, colourful art and a \
  short caption underneath.
- 4–5 scenes total. Each scene: 2–3 short, simple sentences (age 4 vocabulary). No scene longer \
  than 40 words of narrative text.
- Sentences are direct and musical — easy to read aloud.

CONTENT RULES (non-negotiable)
- Princesses, magical creatures, animals, nature, family, and friendship are always welcome themes.
- Zero violence, zero scary elements, zero villains — conflicts are resolved through kindness, \
  cleverness, or courage.
- Every story ends with a clear, gentle lesson a 4-year-old can understand (e.g. sharing, \
  honesty, caring for others, gratitude).
- Occasionally (roughly 1 in 3 stories) weave in a simple biblical value such as love, \
  thankfulness, forgiveness, or caring for the less fortunate — always presented naturally within \
  the narrative, never preachy.

IMAGE PROMPTS
- Style: colorful graphic novel panel, bold outlines, flat vibrant colours, warm lighting, joyful \
  and child-safe.
- Each image prompt must fully describe the scene so it reads independently (include character \
  descriptions, setting, mood, and any key objects).
- No weapons, no darkness, no frightening imagery.

TONE
Warm, playful, and hopeful — the kind of story a loving parent reads at bedtime.`;

/**
 * Wraps the raw user idea in a structured brief that gives the AI enough
 * context to produce a polished, on-brand story every time.
 */
function buildStoryPrompt(rawIdea: string): string {
	return `\
Create a short illustrated story for Sofia (age 4) based on this idea:

"${rawIdea}"

Remember:
• Polish the idea into a complete story arc (beginning → middle → happy ending).
• Apply all standing rules: age-appropriate vocabulary, graphic novel panel style, \
  child-safe images, a gentle lesson, and — if it fits naturally — a biblical value.
• Generate 4–5 scenes. Each scene: 2–3 simple sentences + a detailed image prompt.`;
}

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

		// Build an enriched prompt from the raw user idea.
		// The system message defines the author persona and standing rules;
		// the user message passes the polished story brief.
		const enrichedPrompt = buildStoryPrompt(data.prompt);

		const story = await chat({
			adapter,
			messages: [
				{
					role: "user",
					// @tanstack/ai does not expose a system-message role, so we
					// prepend the standing author rules to the user turn.
					content: [
						{
							type: "text",
							content: `${STORY_SYSTEM_PROMPT}\n\n---\n\n${enrichedPrompt}`,
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
