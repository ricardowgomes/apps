import { Google } from "arctic";

/**
 * Factory function — env arrives per-request in Cloudflare Workers,
 * so we cannot create a module-level singleton.
 */
export function createGoogleClient(env: Env): Google {
	return new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		env.GOOGLE_REDIRECT_URI,
	);
}
