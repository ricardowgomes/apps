const TELEGRAM_API_BASE = "https://api.telegram.org";

interface IncomingMessage {
	from: string; // chat_id as string — used as the "phone number" equivalent
	text: string;
	messageId: number;
	updateId: number;
}

/** Parse the first text message from a Telegram webhook payload */
export function parseIncomingMessage(body: unknown): IncomingMessage | null {
	try {
		const update = body as Record<string, unknown>;
		const message = update?.message as Record<string, unknown> | undefined;
		if (!message) return null;

		const text = message.text as string | undefined;
		if (!text) return null;

		const chat = message.chat as Record<string, unknown>;
		const chatId = String(chat.id);

		return {
			from: chatId,
			text,
			messageId: message.message_id as number,
			updateId: update.update_id as number,
		};
	} catch {
		return null;
	}
}

/** Send a text message via the Telegram Bot API */
export async function sendMessage(
	botToken: string,
	chatId: string,
	text: string,
): Promise<void> {
	const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: "Markdown",
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Telegram API error ${res.status}: ${err}`);
	}
}

/** Register the webhook URL with Telegram (call once after deploy) */
export async function setWebhook(
	botToken: string,
	webhookUrl: string,
	secretToken: string,
): Promise<void> {
	const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/setWebhook`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url: webhookUrl,
			secret_token: secretToken,
			allowed_updates: ["message"],
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Telegram setWebhook error ${res.status}: ${err}`);
	}
}
