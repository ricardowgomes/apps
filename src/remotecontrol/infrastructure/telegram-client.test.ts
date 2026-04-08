import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	parseIncomingMessage,
	sendMessage,
	setWebhook,
} from "./telegram-client";

const mockFetch = vi.fn();
beforeEach(() => vi.stubGlobal("fetch", mockFetch));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

const makeUpdate = (overrides: Record<string, unknown> = {}) => ({
	update_id: 123,
	message: {
		message_id: 1,
		chat: { id: 8637801816, type: "private" },
		text: "Hello",
		...overrides,
	},
});

describe("parseIncomingMessage", () => {
	it("parses a valid text message", () => {
		const result = parseIncomingMessage(makeUpdate());
		expect(result).toEqual({
			from: "8637801816",
			text: "Hello",
			messageId: 1,
		});
	});

	it("returns null when there is no message field", () => {
		expect(parseIncomingMessage({ update_id: 1 })).toBeNull();
	});

	it("returns null when message has no text (e.g. sticker)", () => {
		expect(
			parseIncomingMessage({
				update_id: 1,
				message: { message_id: 1, chat: { id: 123 }, sticker: {} },
			}),
		).toBeNull();
	});

	it("returns null for null input", () => {
		expect(parseIncomingMessage(null)).toBeNull();
	});

	it("returns null for empty object", () => {
		expect(parseIncomingMessage({})).toBeNull();
	});

	it("converts numeric chat id to string", () => {
		const result = parseIncomingMessage(
			makeUpdate({ chat: { id: 999, type: "private" } }),
		);
		expect(result?.from).toBe("999");
	});
});

describe("sendMessage", () => {
	it("POSTs to Telegram sendMessage endpoint", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		await sendMessage("bot-token", "8637801816", "Hello!");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.telegram.org/botbot-token/sendMessage",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining("Hello!"),
			}),
		);
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			text: async () => "Bad request",
		});

		await expect(sendMessage("token", "123", "hi")).rejects.toThrow(
			"Telegram API error 400",
		);
	});
});

describe("setWebhook", () => {
	it("POSTs to setWebhook endpoint with url and secret_token", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		await setWebhook("bot-token", "https://example.com/webhook", "my-secret");

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.url).toBe("https://example.com/webhook");
		expect(body.secret_token).toBe("my-secret");
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			text: async () => "Error",
		});

		await expect(setWebhook("token", "https://url", "secret")).rejects.toThrow(
			"Telegram setWebhook error 500",
		);
	});
});
