import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { categorySchema } from "../domain/category";
import {
	deleteCategory,
	getAllCategories,
	insertCategory,
	updateCategory,
} from "../infrastructure/d1-category-repository";

export const getCategoriesFn = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		const db = context.cloudflare.env.DB;
		return getAllCategories(db);
	},
);

export const createCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(categorySchema)
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const category = {
			...data,
			id: `cat_${crypto.randomUUID()}`,
			createdAt: new Date().toISOString(),
		};
		await insertCategory(db, category);
		return category;
	});

export const updateCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(categorySchema.extend({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const { id, ...fields } = data;
		await updateCategory(db, id, fields);
	});

export const deleteCategoryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await deleteCategory(db, data.id);
	});
