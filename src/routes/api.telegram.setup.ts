import { createFileRoute } from "@tanstack/react-router";
import { setWebhook } from "@/remotecontrol/infrastructure/telegram-client";

/**
 * One-time setup endpoint: registers the Telegram webhook.
 * Hit GET /api/telegram/setup after every deploy to production.
 * Protected by TELEGRAM_WEBHOOK_SECRET.
 */
export const Route = createFileRoute("/api/telegram/setup")({
	server: {
		handlers: {
			GET: async ({ request, context }) => {
				const env = context.cloudflare.env;

				// Simple bearer auth using the same webhook secret
				const auth = request.headers.get("authorization");
				if (auth !== `Bearer ${env.TELEGRAM_WEBHOOK_SECRET}`) {
					return new Response("Unauthorized", { status: 401 });
				}

				const webhookUrl = `https://app.ricardowgomes.workers.dev/api/telegram/webhook`;
				await setWebhook(
					env.TELEGRAM_BOT_TOKEN,
					webhookUrl,
					env.TELEGRAM_WEBHOOK_SECRET,
				);

				return Response.json({ ok: true, webhookUrl });
			},
		},
	},
});
