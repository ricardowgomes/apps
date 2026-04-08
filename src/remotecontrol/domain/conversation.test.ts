import { describe, expect, it } from "vitest";
import { isApproval, isCancellation, isShipCommand } from "./conversation";

describe("isApproval", () => {
	it.each([
		"yes",
		"YES",
		"y",
		"Y",
		"ok",
		"OK",
		"go",
		"GO",
		"lgtm",
		"LGTM",
		"approved",
		"👍",
	])("returns true for %s", (text) => {
		expect(isApproval(text)).toBe(true);
	});

	it.each(["no", "cancel", "ship", "maybe", "yes please", ""])(
		"returns false for %s",
		(text) => {
			expect(isApproval(text)).toBe(false);
		},
	);

	it("ignores surrounding whitespace", () => {
		expect(isApproval("  yes  ")).toBe(true);
	});
});

describe("isCancellation", () => {
	it.each(["no", "NO", "cancel", "CANCEL", "stop", "abort", "nope", "👎"])(
		"returns true for %s",
		(text) => {
			expect(isCancellation(text)).toBe(true);
		},
	);

	it.each(["yes", "ship", "ok", "no thanks"])(
		"returns false for %s",
		(text) => {
			expect(isCancellation(text)).toBe(false);
		},
	);
});

describe("isShipCommand", () => {
	it.each(["ship", "SHIP", "merge", "deploy", "yes", "ok", "do it"])(
		"returns true for %s",
		(text) => {
			expect(isShipCommand(text)).toBe(true);
		},
	);

	it.each(["cancel", "no", "wait", "ship it please"])(
		"returns false for %s",
		(text) => {
			expect(isShipCommand(text)).toBe(false);
		},
	);
});
