import { describe, expect, it } from "vitest";
import { isCancelCommand, isShipCommand } from "./conversation";

describe("isShipCommand", () => {
	it.each(["ship", "SHIP", "merge", "deploy"])(
		"returns true for %s",
		(text) => {
			expect(isShipCommand(text)).toBe(true);
		},
	);

	it.each(["cancel", "no", "wait", "ship it please", "yes", "ok"])(
		"returns false for %s",
		(text) => {
			expect(isShipCommand(text)).toBe(false);
		},
	);
});

describe("isCancelCommand", () => {
	it.each([
		"cancel",
		"CANCEL",
		"stop",
		"abort",
		"please cancel",
		"abort mission",
	])("returns true for %s", (text) => {
		expect(isCancelCommand(text)).toBe(true);
	});

	it.each(["yes", "ship", "ok", "no thanks", "go ahead"])(
		"returns false for %s",
		(text) => {
			expect(isCancelCommand(text)).toBe(false);
		},
	);
});
