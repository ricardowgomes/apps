import { createFileRoute } from "@tanstack/react-router";
import { handleMessage } from "@/remotecontrol/application/conversation-handler";
import { parseIncomingMessage } from "@/remotecontrol/infrastructure/telegram-client";

/**
 * Telegram Bot webhook endpoint.
 *
 * Register with Telegram once after deploy:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://app.ricardowgomes.workers.dev/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 *
 * Returns 200 immediately and processes via ctx.waitUntil to prevent
 * Telegram from retrying on slow AI responses.
 */
export const Route = createFileRoute("/api/telegram/webhook")({
	server: {
		handlers: {
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				const ctx = context.cloudflare.ctx;

				// Verify the request came from Telegram via the secret token header
				const secretHeader = request.headers.get(
					"x-telegram-bot-api-secret-token",
				);
				if (
					env.TELEGRAM_WEBHOOK_SECRET &&
					secretHeader !== env.TELEGRAM_WEBHOOK_SECRET
				) {
					return new Response("Unauthorized", { status: 401 });
				}

				let body: unknown;
				try {
					body = await request.json();
				} catch {
					return new Response("Bad Request", { status: 400 });
				}

				const msg = parseIncomingMessage(body);
				if (!msg) {
					// Not a text message (sticker, photo, etc.) — ignore silently
					return new Response("OK", { status: 200 });
				}

				// Return 200 immediately so Telegram doesn't retry on slow AI responses.
				// The actual processing happens asynchronously via waitUntil.
				ctx.waitUntil(
					handleMessage(
						{
							DB: env.DB,
							TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
							GITHUB_TOKEN: env.GITHUB_TOKEN,
							WORKER_NOTIFY_SECRET: env.WORKER_NOTIFY_SECRET,
							ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
							GEMINI_API_KEY: env.GEMINI_API_KEY,
							GROK_API_KEY: env.GROK_API_KEY,
							OPENAI_API_KEY: env.OPENAI_API_KEY,
							ALLOWED_TELEGRAM_CHAT_IDS: env.ALLOWED_TELEGRAM_CHAT_IDS,
						},
						msg.from,
						msg.text,
						msg.updateId,
					),
				);

				return new Response("OK", { status: 200 });
			},
		},
	},
});
