// Cloudflare secrets — set via `wrangler secret put`, never stored in wrangler.jsonc.
// Extending the auto-generated Env interface from worker-configuration.d.ts.
interface Env {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	ANTHROPIC_API_KEY?: string;
	// Local-only flag — set in .dev.vars to enable the test-only /api/test/login endpoint.
	// Never set in production; the endpoint returns 404 when this is absent.
	CYPRESS?: string;
	// Local-only flag — set in .dev.vars to skip OAuth and return a mock session.
	// Never set in production.
	DEV_AUTO_LOGIN?: string;

	// ── WhatsApp Remote Control ──────────────────────────────────────────────
	// Meta WhatsApp Cloud API token (wrangler secret put WHATSAPP_TOKEN)
	WHATSAPP_TOKEN: string;
	// Meta app secret for verifying webhook signatures (wrangler secret put WHATSAPP_APP_SECRET)
	WHATSAPP_APP_SECRET?: string;
	// Webhook verification token set in the Meta dashboard (wrangler secret put WHATSAPP_VERIFY_TOKEN)
	WHATSAPP_VERIFY_TOKEN: string;
	// Meta phone number ID — set in wrangler.jsonc vars (not secret)
	WHATSAPP_PHONE_NUMBER_ID: string;
	// Comma-separated list of allowed WhatsApp numbers — set in wrangler.jsonc vars
	ALLOWED_WHATSAPP_NUMBERS?: string;
	// GitHub personal access token with repo + workflow scopes (wrangler secret put GITHUB_TOKEN)
	GITHUB_TOKEN: string;
	// Shared secret to authenticate GitHub Actions → Worker notifications (wrangler secret put GITHUB_NOTIFY_SECRET)
	GITHUB_NOTIFY_SECRET: string;
	// AI provider fallbacks (all optional; Anthropic is primary)
	GEMINI_API_KEY?: string;
	GROK_API_KEY?: string;
	OPENAI_API_KEY?: string;
}
