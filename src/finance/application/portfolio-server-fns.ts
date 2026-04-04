import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { portfolioEntrySchema } from "../domain/portfolio-entry";
import {
	getAll,
	insert,
	remove,
	update,
} from "../infrastructure/d1-portfolio-repository";

export const getPortfolioEntriesFn = createServerFn({ method: "GET" }).handler(
	async ({ context }) => {
		const db = context.cloudflare.env.DB;
		return getAll(db);
	},
);

export const createPortfolioEntryFn = createServerFn({ method: "POST" })
	.inputValidator(portfolioEntrySchema)
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const now = new Date().toISOString();
		const entry = {
			...data,
			id: crypto.randomUUID(),
			updatedAt: now,
			createdAt: now,
		};
		await insert(db, entry);
		return entry;
	});

export const updatePortfolioEntryFn = createServerFn({ method: "POST" })
	.inputValidator(portfolioEntrySchema.extend({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		const { id, ...fields } = data;
		await update(db, id, fields);
	});

export const deletePortfolioEntryFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data, context }) => {
		const db = context.cloudflare.env.DB;
		await remove(db, data.id);
	});
