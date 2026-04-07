import { z } from "zod";

// ── Domain entities ──────────────────────────────────────────────────────────

export interface Scene {
	id: string;
	storyId: string;
	order: number;
	text: string;
	imagePrompt: string;
	imageUrl: string | null;
}

export interface Story {
	id: string;
	title: string;
	coverImageUrl: string | null;
	createdAt: Date;
	createdBy: string;
	scenes: Scene[];
}

// Story without scenes — used in the library listing
export type StorySummary = Omit<Story, "scenes"> & { sceneCount: number };

// ── AI generation schema ─────────────────────────────────────────────────────

export const generatedStorySchema = z.object({
	title: z.string().describe("A short, evocative title for the story"),
	scenes: z
		.array(
			z.object({
				text: z
					.string()
					.describe(
						"One paragraph of narrative text for this scene (2–4 sentences, child-friendly)",
					),
				imagePrompt: z
					.string()
					.describe(
						"A vivid image generation prompt describing the scene illustration (style: children's book watercolour painting)",
					),
			}),
		)
		.min(3)
		.max(6)
		.describe("The scenes that make up the story, in order"),
});

export type GeneratedStory = z.infer<typeof generatedStorySchema>;

// ── Gradient palettes for story covers (no image required) ───────────────────

export const STORY_GRADIENTS = [
	"from-violet-600 via-purple-600 to-indigo-700",
	"from-rose-500 via-pink-500 to-fuchsia-600",
	"from-amber-500 via-orange-500 to-red-500",
	"from-emerald-500 via-teal-500 to-cyan-600",
	"from-sky-500 via-blue-500 to-indigo-600",
	"from-fuchsia-500 via-pink-500 to-rose-600",
	"from-lime-500 via-emerald-500 to-teal-600",
	"from-orange-500 via-amber-400 to-yellow-500",
] as const;

/** Deterministically picks a gradient based on the story id */
export function storyGradient(storyId: string): string {
	let hash = 0;
	for (let i = 0; i < storyId.length; i++) {
		hash = (hash << 5) - hash + storyId.charCodeAt(i);
		hash |= 0;
	}
	return STORY_GRADIENTS[Math.abs(hash) % STORY_GRADIENTS.length];
}
