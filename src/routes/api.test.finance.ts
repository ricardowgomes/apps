import { createFileRoute } from "@tanstack/react-router";
import type { Transaction } from "@/finance/domain/transaction";
import { insert } from "@/finance/infrastructure/d1-transaction-repository";

// Test-only endpoint: seeds and resets finance transaction data for E2E tests.
// Only active when the CYPRESS env var is set to "true" (.dev.vars, local only).
export const Route = createFileRoute("/api/test/finance")({
	server: {
		handlers: {
			// Seed an array of transactions supplied in the request body.
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				const { transactions } = (await request.json()) as {
					transactions: Transaction[];
				};
				for (const tx of transactions) {
					await insert(env.DB, tx);
				}
				return Response.json({ ok: true });
			},
			// Delete ALL transactions — resets the local test DB to a clean slate.
			DELETE: async ({ context }) => {
				const env = context.cloudflare.env;
				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}
				await env.DB.prepare("DELETE FROM transactions").run();
				return Response.json({ ok: true });
			},
		},
	},
});
