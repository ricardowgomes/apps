import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportError } from "./error-reporter";

vi.mock("@/remotecontrol/infrastructure/telegram-client", () => ({
	sendMessage: vi.fn(),
}));

import { sendMessage } from "@/remotecontrol/infrastructure/telegram-client";

const env = {
	TELEGRAM_BOT_TOKEN: "test-token",
	ALLOWED_TELEGRAM_CHAT_IDS: "111,222",
};

describe("reportError", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(sendMessage).mockResolvedValue(undefined);
	});

	it("sends a message to every admin chat ID", async () => {
		await reportError(env, new Error("boom"));

		expect(sendMessage).toHaveBeenCalledTimes(2);
		expect(sendMessage).toHaveBeenCalledWith(
			"test-token",
			"111",
			expect.stringContaining("boom"),
		);
		expect(sendMessage).toHaveBeenCalledWith(
			"test-token",
			"222",
			expect.stringContaining("boom"),
		);
	});

	it("includes optional context in the message", async () => {
		await reportError(env, new Error("oops"), {
			route: "/finance/",
			handler: "handleMessage",
		});

		const [, , message] = vi.mocked(sendMessage).mock.calls[0];
		expect(message).toContain("/finance/");
		expect(message).toContain("handleMessage");
	});

	it("handles non-Error thrown values", async () => {
		await reportError(env, "plain string error");

		expect(sendMessage).toHaveBeenCalledWith(
			"test-token",
			"111",
			expect.stringContaining("plain string error"),
		);
	});

	it("does not throw when TELEGRAM_BOT_TOKEN is absent", async () => {
		await expect(
			reportError(
				{ TELEGRAM_BOT_TOKEN: "", ALLOWED_TELEGRAM_CHAT_IDS: "111" },
				new Error("x"),
			),
		).resolves.toBeUndefined();
		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("does not throw when ALLOWED_TELEGRAM_CHAT_IDS is absent", async () => {
		await expect(
			reportError({ TELEGRAM_BOT_TOKEN: "token" }, new Error("x")),
		).resolves.toBeUndefined();
		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("does not throw when sendMessage rejects", async () => {
		vi.mocked(sendMessage).mockRejectedValue(new Error("network error"));

		await expect(
			reportError(env, new Error("original")),
		).resolves.toBeUndefined();
	});

	it("still sends to remaining chats when one send fails", async () => {
		vi.mocked(sendMessage)
			.mockRejectedValueOnce(new Error("network error"))
			.mockResolvedValueOnce(undefined);

		await reportError(env, new Error("partial failure"));

		expect(sendMessage).toHaveBeenCalledTimes(2);
	});
});
