import Anthropic from "@anthropic-ai/sdk";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { isSessionExpired, SESSION_COOKIE_NAME } from "@/auth/domain/session";
import { getById as getSessionById } from "@/auth/infrastructure/d1-session-repository";
import { reportError } from "@/observability/error-reporter";
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

// JSON Schema for the structured story output tool — mirrors generatedStorySchema.
// Defined inline to avoid a zod-to-json-schema dependency.
const STORY_OUTPUT_SCHEMA = {
	type: "object" as const,
	properties: {
		title: {
			type: "string",
			description: "A short, evocative title for the story",
		},
		scenes: {
			type: "array",
			description: "The scenes that make up the story, in order",
			minItems: 3,
			maxItems: 6,
			items: {
				type: "object",
				properties: {
					text: {
						type: "string",
						description:
							"One paragraph of narrative text for this scene (2–4 sentences, child-friendly)",
					},
					imagePrompt: {
						type: "string",
						description:
							"A vivid image generation prompt describing the scene illustration (style: colorful graphic novel panel, bold outlines, flat colours, child-safe, no violence, warm and joyful)",
					},
				},
				required: ["text", "imagePrompt"],
			},
		},
	},
	required: ["title", "scenes"],
};

// ── Generate ─────────────────────────────────────────────────────────────────

export const generateStoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ prompt: z.string().min(1).max(500) }))
	.handler(async ({ data, context }) => {
		const env = context.cloudflare.env;
		const db = env.DB;
		const apiKey = env.ANTHROPIC_API_KEY;
		if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

		// Resolve current user from session cookie
		const sessionId = getCookie(SESSION_COOKIE_NAME);
		if (!sessionId) throw new Error("Not authenticated");
		const session = await getSessionById(db, sessionId);
		if (!session || isSessionExpired(session))
			throw new Error("Session expired");

		try {
			const client = new Anthropic({ apiKey });

			// Single API call: force the model to call the structured_output tool.
			// This avoids the double-call overhead of @tanstack/ai's structured output flow.
			const response = await client.messages.create({
				model: "claude-3-5-haiku-20241022",
				max_tokens: 2048,
				system: STORY_SYSTEM_PROMPT,
				messages: [{ role: "user", content: buildStoryPrompt(data.prompt) }],
				tools: [
					{
						name: "structured_output",
						description:
							"Use this tool to provide your story response in the required structured format.",
						input_schema: STORY_OUTPUT_SCHEMA,
					},
				],
				tool_choice: { type: "tool", name: "structured_output" },
			});

			// Extract the tool call result
			const toolBlock = response.content.find(
				(block) =>
					block.type === "tool_use" && block.name === "structured_output",
			);
			if (!toolBlock || toolBlock.type !== "tool_use") {
				throw new Error("Model did not return structured output");
			}

			// Validate against the Zod schema
			const story = generatedStorySchema.parse(toolBlock.input);
			const storyId = await saveGeneratedStory(db, story, session.userEmail);

			return { storyId, story };
		} catch (err) {
			await reportError(env, err, {
				route: "/stories/new",
				handler: "generateStoryFn",
			});
			throw err;
		}
	});

// ── Delete ───────────────────────────────────────────────────────────────────

export const deleteStoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ storyId: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await deleteStory(db, data.storyId);
	});
