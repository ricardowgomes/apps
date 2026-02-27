import { createFileRoute } from "@tanstack/react-router";
import {
	SESSION_COOKIE_NAME,
	SESSION_DURATION_MS,
} from "@/auth/domain/session";
import { insert } from "@/auth/infrastructure/d1-session-repository";

// Test-only endpoint: seeds a D1 session for a fixed test user and returns the
// session ID so Cypress can set the cookie directly. The route is always
// registered (file-based routing) but returns 404 unless the CYPRESS flag is
// set in the environment — which is only the case in .dev.vars (local only).
export const Route = createFileRoute("/api/test/login")({
	server: {
		handlers: {
			GET: async ({ context }) => {
				const env = context.cloudflare.env;

				if (env.CYPRESS !== "true") {
					return new Response("Not found", { status: 404 });
				}

				const sessionId = crypto.randomUUID();
				const now = new Date();
				const expiresAt = new Date(
					now.getTime() + SESSION_DURATION_MS,
				).toISOString();

				await insert(env.DB, {
					id: sessionId,
					userEmail: "test@example.com",
					userName: "Test User",
					userAvatar: null,
					expiresAt,
					createdAt: now.toISOString(),
				});

				return Response.json({ sessionId, cookieName: SESSION_COOKIE_NAME });
			},
		},
	},
});
