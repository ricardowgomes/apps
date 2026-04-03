import { createFileRoute } from "@tanstack/react-router";
import type { Category } from "@/finance/domain/category";
import { insertCategory } from "@/finance/infrastructure/d1-category-repository";

// Test-only endpoint: seeds and resets category data for E2E tests.
// Only active when the CYPRESS env var is set to "true" (.dev.vars, local only).
export const Route = createFileRoute("/api/test/categories")({
	server: {
		handlers: {
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				const { categories } = (await request.json()) as {
					categories: Category[];
				};
				for (const cat of categories) {
					await insertCategory(env.DB, cat);
				}
				return Response.json({ ok: true });
			},
			DELETE: async ({ context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				await env.DB.prepare("DELETE FROM categories").run();
				return Response.json({ ok: true });
			},
		},
	},
});
