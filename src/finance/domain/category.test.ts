import { describe, expect, it } from "vitest";
import type { Category } from "./category";
import { categorySchema, suggestCategory } from "./category";

const makeCategory = (name: string, keywords: string[]): Category => ({
	id: `cat_${name.toLowerCase()}`,
	name,
	icon: "",
	color: "#6366f1",
	keywords,
	createdAt: "2024-01-01T00:00:00.000Z",
});

const categories: Category[] = [
	makeCategory("Groceries", ["grocery", "walmart", "loblaws"]),
	makeCategory("Food & Dining", ["restaurant", "mcdonald", "uber eats"]),
	makeCategory("Transport", ["uber", "gas", "shell"]),
	makeCategory("Uncategorized", []),
];

describe("suggestCategory", () => {
	it("matches a keyword in the description (case-insensitive)", () => {
		expect(suggestCategory("WALMART SUPERCENTRE", categories)).toBe(
			"Groceries",
		);
	});

	it("matches a multi-word keyword", () => {
		expect(suggestCategory("Uber Eats order #123", categories)).toBe(
			"Food & Dining",
		);
	});

	it("prefers the first matching category when multiple could match", () => {
		// "uber" appears in both Transport and Food & Dining keywords;
		// Transport comes first in the array so it wins
		const cats = [
			makeCategory("Transport", ["uber"]),
			makeCategory("Food & Dining", ["uber eats"]),
			makeCategory("Uncategorized", []),
		];
		expect(suggestCategory("Uber trip downtown", cats)).toBe("Transport");
	});

	it("returns Uncategorized when no keyword matches", () => {
		expect(suggestCategory("random unknown merchant xyz", categories)).toBe(
			"Uncategorized",
		);
	});

	it("skips the Uncategorized category itself during matching", () => {
		const catsWithEmptyUncategorized = [makeCategory("Uncategorized", ["xyz"])];
		// Even if Uncategorized has keywords, it should be skipped
		expect(suggestCategory("xyz purchase", catsWithEmptyUncategorized)).toBe(
			"Uncategorized",
		);
	});

	it("returns Uncategorized for an empty categories list", () => {
		expect(suggestCategory("walmart", [])).toBe("Uncategorized");
	});

	it("returns Uncategorized for an empty description", () => {
		expect(suggestCategory("", categories)).toBe("Uncategorized");
	});

	it("matches keyword that appears mid-word in description", () => {
		// "gas" appears inside "gasoline" — keyword matching uses includes()
		expect(suggestCategory("gasoline purchase", categories)).toBe("Transport");
	});
});

// ── categorySchema ────────────────────────────────────────────────────────────

describe("categorySchema", () => {
	it("accepts a fully valid category", () => {
		const result = categorySchema.safeParse({
			name: "Groceries",
			icon: "🛒",
			color: "#4ade80",
			keywords: ["walmart", "loblaws"],
		});
		expect(result.success).toBe(true);
	});

	it("applies default color and icon when omitted", () => {
		const result = categorySchema.safeParse({ name: "Misc" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.icon).toBe("");
			expect(result.data.color).toBe("#6366f1");
			expect(result.data.keywords).toEqual([]);
		}
	});

	it("rejects an empty name", () => {
		const result = categorySchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects a name longer than 64 characters", () => {
		const result = categorySchema.safeParse({ name: "a".repeat(65) });
		expect(result.success).toBe(false);
	});

	it("accepts a name of exactly 64 characters", () => {
		const result = categorySchema.safeParse({ name: "a".repeat(64) });
		expect(result.success).toBe(true);
	});

	it("rejects a color that is not a valid 6-digit hex", () => {
		const result = categorySchema.safeParse({ name: "Test", color: "red" });
		expect(result.success).toBe(false);
	});

	it("rejects a 3-digit hex color shorthand", () => {
		const result = categorySchema.safeParse({ name: "Test", color: "#fff" });
		expect(result.success).toBe(false);
	});

	it("accepts both uppercase and lowercase hex digits", () => {
		expect(
			categorySchema.safeParse({ name: "A", color: "#AABBCC" }).success,
		).toBe(true);
		expect(
			categorySchema.safeParse({ name: "B", color: "#aabbcc" }).success,
		).toBe(true);
	});
});
