import { createFileRoute } from "@tanstack/react-router";
import { handleMessage } from "@/remotecontrol/application/conversation-handler";
import {
	parseIncomingMessage,
	verifySignature,
} from "@/remotecontrol/infrastructure/whatsapp-client";

export const Route = createFileRoute("/api/whatsapp/webhook")({
	server: {
		handlers: {
			/** Meta webhook verification handshake */
			GET: async ({ request, context }) => {
				const env = context.cloudflare.env;
				const url = new URL(request.url);
				const mode = url.searchParams.get("hub.mode");
				const token = url.searchParams.get("hub.verify_token");
				const challenge = url.searchParams.get("hub.challenge");

				if (
					mode === "subscribe" &&
					token === env.WHATSAPP_VERIFY_TOKEN &&
					challenge
				) {
					return new Response(challenge, { status: 200 });
				}
				return new Response("Forbidden", { status: 403 });
			},

			/** Incoming WhatsApp messages */
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;
				const rawBody = await request.text();

				// Verify the request is from Meta
				const signature = request.headers.get("x-hub-signature-256") ?? "";
				if (env.WHATSAPP_APP_SECRET) {
					const valid = await verifySignature(
						rawBody,
						signature,
						env.WHATSAPP_APP_SECRET,
					);
					if (!valid) return new Response("Unauthorized", { status: 401 });
				}

				let body: unknown;
				try {
					body = JSON.parse(rawBody);
				} catch {
					return new Response("Bad Request", { status: 400 });
				}

				const msg = parseIncomingMessage(body);
				if (!msg) {
					// Meta sends status update events too — acknowledge them silently
					return new Response("OK", { status: 200 });
				}

				await handleMessage(
					{
						DB: env.DB,
						WHATSAPP_TOKEN: env.WHATSAPP_TOKEN,
						WHATSAPP_PHONE_NUMBER_ID: env.WHATSAPP_PHONE_NUMBER_ID,
						GITHUB_TOKEN: env.GITHUB_TOKEN,
						ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
						GEMINI_API_KEY: env.GEMINI_API_KEY,
						GROK_API_KEY: env.GROK_API_KEY,
						OPENAI_API_KEY: env.OPENAI_API_KEY,
						ALLOWED_WHATSAPP_NUMBERS: env.ALLOWED_WHATSAPP_NUMBERS,
					},
					msg.from,
					msg.text,
				);

				return new Response("OK", { status: 200 });
			},
		},
	},
});
