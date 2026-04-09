import { createFileRoute } from "@tanstack/react-router";
import { saveGeneratedStory } from "@/stories/infrastructure/d1-story-repository";

// Test-only endpoint: seeds and resets story data for E2E tests.
// Only active when the CYPRESS env var is set to "true" (.dev.vars, local only).
export const Route = createFileRoute("/api/test/stories")({
	server: {
		handlers: {
			// Seed a single story (title + scenes) into D1.
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				const body = (await request.json()) as {
					title: string;
					scenes: Array<{ text: string; imagePrompt: string }>;
				};
				const imageUrls = body.scenes.map(() => "");
				const storyId = await saveGeneratedStory(
					env.DB,
					body,
					imageUrls,
					"test@example.com",
				);
				return Response.json({ storyId });
			},
			// Delete all stories — resets the local test DB to a clean slate.
			DELETE: async ({ context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				await env.DB.prepare("DELETE FROM scenes").run();
				await env.DB.prepare("DELETE FROM stories").run();
				return Response.json({ ok: true });
			},
		},
	},
});
