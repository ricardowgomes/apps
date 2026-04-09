import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { reportError } from "./observability/error-reporter";
import { checkStuckConversations } from "./remotecontrol/application/conversation-handler";

const handler = createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		try {
			return await handler(request, { context: { cloudflare: { env, ctx } } });
		} catch (err) {
			const { pathname } = new URL(request.url);
			// Fire-and-forget — don't await so the error response is immediate
			ctx.waitUntil(
				reportError(env, err, { route: pathname, handler: "fetch" }),
			);
			return new Response("Internal Server Error", { status: 500 });
		}
	},

	async scheduled(
		_controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	) {
		ctx.waitUntil(
			checkStuckConversations({
				DB: env.DB,
				TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
				GITHUB_TOKEN: env.GITHUB_TOKEN,
				WORKER_NOTIFY_SECRET: env.WORKER_NOTIFY_SECRET,
				ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
				GEMINI_API_KEY: env.GEMINI_API_KEY,
				GROK_API_KEY: env.GROK_API_KEY,
				OPENAI_API_KEY: env.OPENAI_API_KEY,
				ALLOWED_TELEGRAM_CHAT_IDS: env.ALLOWED_TELEGRAM_CHAT_IDS,
			}),
		);
	},
};
