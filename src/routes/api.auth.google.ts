import { createFileRoute } from "@tanstack/react-router";
import { generateCodeVerifier, generateState } from "arctic";
import { createGoogleClient } from "@/auth/infrastructure/google-oauth-client";

export const Route = createFileRoute("/api/auth/google")({
	server: {
		handlers: {
			GET: async ({ context }) => {
				const env = context.cloudflare.env;
				const google = createGoogleClient(env);

				const state = generateState();
				const codeVerifier = generateCodeVerifier();
				const url = google.createAuthorizationURL(state, codeVerifier, [
					"openid",
					"profile",
					"email",
				]);

				const pkceOpts = "HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600";

				const headers = new Headers({ Location: url.toString() });
				headers.append("Set-Cookie", `oauth_state=${state}; ${pkceOpts}`);
				headers.append(
					"Set-Cookie",
					`oauth_code_verifier=${codeVerifier}; ${pkceOpts}`,
				);

				return new Response(null, { status: 302, headers });
			},
		},
	},
});
