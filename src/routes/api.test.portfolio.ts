import { createFileRoute } from "@tanstack/react-router";
import type { PortfolioEntry } from "@/finance/domain/portfolio-entry";
import { insert } from "@/finance/infrastructure/d1-portfolio-repository";

// Test-only endpoint: seeds and resets portfolio entry data for E2E tests.
// Only active when the CYPRESS env var is set to "true" (.dev.vars, local only).
export const Route = createFileRoute("/api/test/portfolio")({
	server: {
		handlers: {
			// Seed an array of portfolio entries supplied in the request body.
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				const { entries } = (await request.json()) as {
					entries: PortfolioEntry[];
				};
				for (const entry of entries) {
					await insert(env.DB, entry);
				}
				return Response.json({ ok: true });
			},
			// Delete ALL portfolio entries — resets the local test DB.
			DELETE: async ({ context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				await env.DB.prepare("DELETE FROM portfolio_entries").run();
				return Response.json({ ok: true });
			},
		},
	},
});
