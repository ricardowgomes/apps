import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { reportError } from "./observability/error-reporter";

const handler = createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
		try {
			return await handler(request, { context: { cloudflare: { env } } });
		} catch (err) {
			const { pathname } = new URL(request.url);
			// Fire-and-forget — don't await so the error response is immediate
			_ctx.waitUntil(
				reportError(env, err, { route: pathname, handler: "fetch" }),
			);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};
