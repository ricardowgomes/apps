import { z } from "zod";

export const categorySchema = z.object({
	name: z.string().min(1).max(64),
	icon: z.string().max(8).default(""),
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.default("#6366f1"),
	// Keywords used for auto-categorisation (lowercase, matched against description)
	keywords: z.array(z.string()).default([]),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export interface Category extends CategoryInput {
	id: string;
	createdAt: string;
}

/**
 * Returns the best-matching category name for a given transaction description.
 * Matches by checking if any keyword appears in the description (case-insensitive).
 * Returns "Uncategorized" when nothing matches.
 */
export function suggestCategory(
	description: string,
	categories: Category[],
): string {
	const lower = description.toLowerCase();
	for (const cat of categories) {
		if (cat.name === "Uncategorized") continue;
		for (const kw of cat.keywords) {
			if (lower.includes(kw)) return cat.name;
		}
	}
	return "Uncategorized";
}
