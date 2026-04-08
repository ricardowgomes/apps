import { sendMessage } from "@/remotecontrol/infrastructure/telegram-client";

interface ErrorContext {
	/** Route or URL path where the error occurred */
	route?: string;
	/** Handler or function name where the error was caught */
	handler?: string;
}

/**
 * Sanitise text for Telegram Markdown v1: escape *, _, `, [ so variable
 * content cannot break bold/italic/code formatting in surrounding labels.
 */
function sanitize(text: string): string {
	return text.replace(/[*_`[]/g, "\\$&");
}

function formatErrorMessage(error: unknown, context?: ErrorContext): string {
	const err = error instanceof Error ? error : new Error(String(error));
	const timestamp = new Date().toUTCString();

	// First 5 stack lines, capped at 600 chars to stay well within Telegram's 4096-char limit
	const stack = sanitize(
		(err.stack ?? err.message).split("\n").slice(0, 5).join("\n").slice(0, 600),
	);

	const lines = [
		"🚨 *Error — exponencial*",
		`*Message:* ${sanitize(err.message.slice(0, 300))}`,
	];

	if (context?.handler) lines.push(`*Handler:* ${sanitize(context.handler)}`);
	if (context?.route) lines.push(`*Route:* ${sanitize(context.route)}`);
	lines.push(`*Time:* ${timestamp}`);
	lines.push("");
	lines.push(stack);

	return lines.join("\n");
}

interface MinimalEnv {
	TELEGRAM_BOT_TOKEN: string;
	ALLOWED_TELEGRAM_CHAT_IDS?: string;
}

/**
 * Fire-and-forget: send an error notification to all admin Telegram chat IDs.
 * Never throws — a broken error reporter must not mask the original error.
 */
export async function reportError(
	env: MinimalEnv,
	error: unknown,
	context?: ErrorContext,
): Promise<void> {
	try {
		if (!env.TELEGRAM_BOT_TOKEN || !env.ALLOWED_TELEGRAM_CHAT_IDS) return;

		const chatIds = env.ALLOWED_TELEGRAM_CHAT_IDS.split(",").map((id) =>
			id.trim(),
		);
		const message = formatErrorMessage(error, context);

		// Use allSettled so a single failed send doesn't block the rest
		await Promise.allSettled(
			chatIds.map((chatId) =>
				sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, message),
			),
		);
	} catch {
		// Last-resort: log locally so there's at least a trace in Cloudflare Workers logs
		console.error("[observability] Failed to report error to Telegram:", error);
	}
}
