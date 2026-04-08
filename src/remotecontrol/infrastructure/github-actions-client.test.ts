import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	closePr,
	mergePr,
	triggerImplementation,
	verifyGitHubNotifySecret,
} from "./github-actions-client";

const mockFetch = vi.fn();
beforeEach(() => vi.stubGlobal("fetch", mockFetch));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe("verifyGitHubNotifySecret", () => {
	it("returns true when header matches secret", () => {
		expect(verifyGitHubNotifySecret("Bearer mysecret", "mysecret")).toBe(true);
	});

	it("returns false when header has wrong secret", () => {
		expect(verifyGitHubNotifySecret("Bearer wrong", "mysecret")).toBe(false);
	});

	it("returns false when header is null", () => {
		expect(verifyGitHubNotifySecret(null, "mysecret")).toBe(false);
	});

	it("returns false when header is empty string", () => {
		expect(verifyGitHubNotifySecret("", "mysecret")).toBe(false);
	});

	it("returns false when Bearer prefix is missing", () => {
		expect(verifyGitHubNotifySecret("mysecret", "mysecret")).toBe(false);
	});
});

describe("triggerImplementation", () => {
	it("dispatches workflow with correct inputs", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		await triggerImplementation(
			"gh-token",
			"conv-1",
			"Add dark mode",
			"dark-mode",
		);

		const [url, opts] = mockFetch.mock.calls[0];
		expect(url).toContain("implement-feature.yml/dispatches");
		const body = JSON.parse(opts.body);
		expect(body.inputs.conversation_id).toBe("conv-1");
		expect(body.inputs.branch_slug).toBe("dark-mode");
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 422,
			text: async () => "Unprocessable",
		});

		await expect(
			triggerImplementation("token", "conv", "spec", "slug"),
		).rejects.toThrow("GitHub API error 422");
	});
});

describe("mergePr", () => {
	it("sends squash merge request", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		await mergePr("gh-token", 42);

		const [url, opts] = mockFetch.mock.calls[0];
		expect(url).toContain("/pulls/42/merge");
		expect(JSON.parse(opts.body).merge_method).toBe("squash");
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 405,
			text: async () => "Not mergeable",
		});

		await expect(mergePr("token", 1)).rejects.toThrow("GitHub merge error 405");
	});
});

describe("closePr", () => {
	it("sends PATCH to close the PR", async () => {
		mockFetch.mockResolvedValueOnce({ ok: true });

		await closePr("gh-token", 42);

		const [url, opts] = mockFetch.mock.calls[0];
		expect(url).toContain("/pulls/42");
		expect(JSON.parse(opts.body).state).toBe("closed");
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			text: async () => "Not found",
		});

		await expect(closePr("token", 99)).rejects.toThrow(
			"GitHub close PR error 404",
		);
	});
});
