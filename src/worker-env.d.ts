// Cloudflare secrets — set via `wrangler secret put`, never stored in wrangler.jsonc.
// Extending the auto-generated Env interface from worker-configuration.d.ts.
interface Env {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	// Local-only flag — set in .dev.vars to enable the test-only /api/test/login endpoint.
	// Never set in production; the endpoint returns 404 when this is absent.
	CYPRESS?: string;
}
