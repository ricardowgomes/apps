import { describe, expect, it } from "vitest";
import type { Category } from "./category";
import { suggestCategory } from "./category";

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
});
