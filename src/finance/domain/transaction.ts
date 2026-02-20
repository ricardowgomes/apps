import { z } from "zod";

export type TransactionType = "income" | "expense";

export const INCOME_CATEGORIES = [
	"Salary",
	"Freelance",
	"Investment",
	"Rental",
	"Other",
] as const;

export const EXPENSE_CATEGORIES = [
	"Food & Dining",
	"Housing",
	"Transport",
	"Healthcare",
	"Entertainment",
	"Shopping",
	"Education",
	"Utilities",
	"Other",
] as const;

export const transactionSchema = z.object({
	type: z.enum(["income", "expense"]),
	amount: z.number().positive("Amount must be greater than zero"),
	currency: z.string().min(1),
	category: z.string().min(1, "Category is required"),
	description: z.string().min(1, "Description is required"),
	date: z.string().min(1, "Date is required"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export interface Transaction extends TransactionInput {
	id: string;
	createdAt: string;
}
