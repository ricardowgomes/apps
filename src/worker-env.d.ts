// Cloudflare secrets — set via `wrangler secret put`, never stored in wrangler.jsonc.
// Extending the auto-generated Env interface from worker-configuration.d.ts.
interface Env {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
}
