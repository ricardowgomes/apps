const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface IncomingMessage {
	from: string;
	text: string;
	messageId: string;
}

/** Parse the first text message from a Meta webhook payload */
export function parseIncomingMessage(body: unknown): IncomingMessage | null {
	try {
		const entry = (body as Record<string, unknown>)?.entry;
		if (!Array.isArray(entry) || entry.length === 0) return null;

		const changes = entry[0]?.changes;
		if (!Array.isArray(changes) || changes.length === 0) return null;

		const value = changes[0]?.value;
		const messages = value?.messages;
		if (!Array.isArray(messages) || messages.length === 0) return null;

		const msg = messages[0];
		if (msg?.type !== "text") return null;

		return {
			from: msg.from as string,
			text: (msg.text?.body as string) ?? "",
			messageId: msg.id as string,
		};
	} catch {
		return null;
	}
}

/** Send a text message via the WhatsApp Cloud API */
export async function sendMessage(
	phoneNumberId: string,
	token: string,
	to: string,
	text: string,
): Promise<void> {
	const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messaging_product: "whatsapp",
			to,
			type: "text",
			text: { body: text },
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`WhatsApp API error ${res.status}: ${err}`);
	}
}

/** Verify Meta webhook signature (X-Hub-Signature-256 header) */
export async function verifySignature(
	body: string,
	signatureHeader: string,
	appSecret: string,
): Promise<boolean> {
	if (!signatureHeader.startsWith("sha256=")) return false;
	const sigHex = signatureHeader.slice(7);

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(appSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
	const computed = Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return computed === sigHex;
}
