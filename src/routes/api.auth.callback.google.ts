import { getCloudflareContext } from "@cloudflare/vite-plugin";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { decodeIdToken, OAuth2RequestError } from "arctic";
import {
	SESSION_COOKIE_NAME,
	SESSION_DURATION_MS,
} from "@/auth/domain/session";
import { insert } from "@/auth/infrastructure/d1-session-repository";
import { createGoogleClient } from "@/auth/infrastructure/google-oauth-client";

interface GoogleClaims {
	email: string;
	name?: string;
	picture?: string;
}

export const APIRoute = createAPIFileRoute("/api/auth/callback/google")({
	GET: async ({ request }) => {
		const { env } = await getCloudflareContext<Env>();
		const reqUrl = new URL(request.url);
		const code = reqUrl.searchParams.get("code");
		const state = reqUrl.searchParams.get("state");

		const cookies = parseCookies(request.headers.get("Cookie") ?? "");
		const storedState = cookies.oauth_state;
		const codeVerifier = cookies.oauth_code_verifier;

		if (
			!code ||
			!state ||
			!storedState ||
			!codeVerifier ||
			state !== storedState
		) {
			return new Response("Invalid OAuth state", { status: 400 });
		}

		try {
			const google = createGoogleClient(env);
			const tokens = await google.validateAuthorizationCode(code, codeVerifier);
			const idToken = tokens.idToken();
			const claims = decodeIdToken(idToken) as GoogleClaims;

			const allowedEmails = env.ALLOWED_EMAILS.split(",").map((e) => e.trim());
			if (!allowedEmails.includes(claims.email)) {
				return new Response(
					"Access denied. Your email is not on the authorized list.",
					{ status: 403 },
				);
			}

			const sessionId = crypto.randomUUID();
			const expiresAt = new Date(
				Date.now() + SESSION_DURATION_MS,
			).toISOString();

			await insert(env.DB, {
				id: sessionId,
				userEmail: claims.email,
				userName: claims.name ?? null,
				userAvatar: claims.picture ?? null,
				expiresAt,
				createdAt: new Date().toISOString(),
			});

			const clearOpts = "HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
			const sessionOpts = `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`;

			const headers = new Headers({ Location: "/finance" });
			headers.append("Set-Cookie", `oauth_state=; ${clearOpts}`);
			headers.append("Set-Cookie", `oauth_code_verifier=; ${clearOpts}`);
			headers.append(
				"Set-Cookie",
				`${SESSION_COOKIE_NAME}=${sessionId}; ${sessionOpts}`,
			);

			return new Response(null, { status: 302, headers });
		} catch (e) {
			if (e instanceof OAuth2RequestError) {
				return new Response(`OAuth error: ${e.message}`, { status: 400 });
			}
			throw e;
		}
	},
});

function parseCookies(cookieHeader: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const part of cookieHeader.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key) {
			result[key.trim()] = rest.join("=").trim();
		}
	}
	return result;
}
