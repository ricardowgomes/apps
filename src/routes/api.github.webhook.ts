import { createFileRoute } from "@tanstack/react-router";
import {
	handleDeployNotification,
	handlePrCreated,
} from "@/remotecontrol/application/conversation-handler";
import { verifyGitHubNotifySecret } from "@/remotecontrol/infrastructure/github-actions-client";

/**
 * Receives internal notifications from GitHub Actions:
 * - PR created (from implement-feature.yml)
 * - Deploy completed (from ci.yml deploy job)
 *
 * Protected by a shared secret in the Authorization header.
 */
export const Route = createFileRoute("/api/github/webhook")({
	server: {
		handlers: {
			POST: async ({ request, context }) => {
				const env = context.cloudflare.env;

				const authHeader = request.headers.get("authorization");
				if (!verifyGitHubNotifySecret(authHeader, env.GITHUB_NOTIFY_SECRET)) {
					return new Response("Unauthorized", { status: 401 });
				}

				let body: Record<string, unknown>;
				try {
					body = await request.json();
				} catch {
					return new Response("Bad Request", { status: 400 });
				}

				const event = body.event as string;

				if (event === "pr_created") {
					const { conversation_id, pr_url, pr_number } = body as {
						conversation_id: string;
						pr_url: string;
						pr_number: number;
					};

					await handlePrCreated(
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
						conversation_id,
						pr_url,
						pr_number,
					);
				} else if (event === "deploy") {
					const { status, deploy_url, commit_message } = body as {
						status: "success" | "failure";
						deploy_url: string;
						commit_message: string;
					};

					await handleDeployNotification(
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
						status,
						deploy_url,
						commit_message,
					);
				}

				return new Response("OK", { status: 200 });
			},
		},
	},
});
