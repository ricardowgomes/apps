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

	// ── Telegram Remote Control ───────────────────────────────────────────────
	// Telegram Bot token from @BotFather (wrangler secret put TELEGRAM_BOT_TOKEN)
	TELEGRAM_BOT_TOKEN: string;
	// Secret token to verify webhook requests come from Telegram (wrangler secret put TELEGRAM_WEBHOOK_SECRET)
	TELEGRAM_WEBHOOK_SECRET: string;
	// Comma-separated list of allowed Telegram chat IDs — set in wrangler.jsonc vars
	ALLOWED_TELEGRAM_CHAT_IDS?: string;
	// GitHub personal access token with repo + workflow scopes (wrangler secret put GITHUB_TOKEN)
	GITHUB_TOKEN: string;
	// Shared secret to authenticate GitHub Actions → Worker notifications (wrangler secret put WORKER_NOTIFY_SECRET)
	WORKER_NOTIFY_SECRET: string;
	// AI provider fallbacks (all optional; Anthropic is primary)
	GEMINI_API_KEY?: string;
	GROK_API_KEY?: string;
	OPENAI_API_KEY?: string;
}
