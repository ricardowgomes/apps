import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transactionSchema } from "../domain/transaction";
import {
	getAll,
	insert,
	insertMany,
	remove,
	update,
	updateCategoryByDescription,
} from "../infrastructure/d1-transaction-repository";

export const getTransactionsFn = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		const db = context.cloudflare.env.DB;
		return getAll(db);
	},
);

export const createTransactionFn = createServerFn({ method: "POST" })
	.inputValidator(transactionSchema)
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const transaction = {
			...data,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};
		await insert(db, transaction);
		return transaction;
	});

export const updateTransactionFn = createServerFn({ method: "POST" })
	.inputValidator(transactionSchema.extend({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const { id, ...fields } = data;
		await update(db, id, fields);
	});

export const deleteTransactionFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await remove(db, data.id);
	});

const importRowSchema = transactionSchema.extend({
	id: z.string(),
	createdAt: z.string(),
});

/**
 * Updates the category for every transaction whose description exactly matches
 * the given description. Used for "apply to all matching" after categorising one.
 */
export const updateCategoryByDescriptionFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ description: z.string(), category: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const updated = await updateCategoryByDescription(
			db,
			data.description,
			data.category,
		);
		return { updated };
	});

export const bulkImportTransactionsFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ transactions: z.array(importRowSchema) }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		return insertMany(db, data.transactions);
	});
