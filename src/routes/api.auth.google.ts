import { getCloudflareContext } from "@cloudflare/vite-plugin";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { generateCodeVerifier, generateState } from "arctic";
import { createGoogleClient } from "@/auth/infrastructure/google-oauth-client";

export const APIRoute = createAPIFileRoute("/api/auth/google")({
	GET: async () => {
		const { env } = await getCloudflareContext<Env>();
		const google = createGoogleClient(env);

		const state = generateState();
		const codeVerifier = generateCodeVerifier();
		const url = google.createAuthorizationURL(state, codeVerifier, [
			"openid",
			"profile",
			"email",
		]);

		const pkceOpts =
			"HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600; Same-Party=false";

		const headers = new Headers({ Location: url.toString() });
		headers.append("Set-Cookie", `oauth_state=${state}; ${pkceOpts}`);
		headers.append(
			"Set-Cookie",
			`oauth_code_verifier=${codeVerifier}; ${pkceOpts}`,
		);

		return new Response(null, { status: 302, headers });
	},
});
