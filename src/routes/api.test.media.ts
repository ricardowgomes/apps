import { createFileRoute } from "@tanstack/react-router";
import { createMediaItemSchema } from "@/media/domain/media-item";
import { createMediaItem } from "@/media/infrastructure/d1-media-repository";

// Test-only endpoint: seeds and resets media data for E2E tests.
// Only active when the CYPRESS env var is set to "true" (.dev.vars, local only).
export const Route = createFileRoute("/api/test/media")({
	server: {
		handlers: {
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				const raw = await request.json();
				const body = createMediaItemSchema.parse(raw);
				const id = await createMediaItem(env.DB, body, "test@example.com");
				return Response.json({ id });
			},
			DELETE: async ({ context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				await env.DB.prepare("DELETE FROM media_items").run();
				return Response.json({ ok: true });
			},
		},
	},
});
