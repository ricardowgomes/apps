import { Store } from "@tanstack/store";
import type { Transaction } from "../domain/transaction";

function makeSeedTx(
	id: string,
	type: "income" | "expense",
	amount: number,
	category: string,
	description: string,
	daysAgo: number,
): Transaction {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return {
		id,
		type,
		amount,
		currency: "CAD",
		category,
		description,
		date: date.toISOString().split("T")[0],
		createdAt: new Date().toISOString(),
	};
}

const seedTransactions: Transaction[] = [
	makeSeedTx("seed-1", "income", 5200, "Salary", "Monthly salary", 2),
	makeSeedTx("seed-2", "expense", 1800, "Housing", "Rent — February", 2),
	makeSeedTx("seed-3", "expense", 85.5, "Food & Dining", "Grocery run", 3),
	makeSeedTx("seed-4", "expense", 45, "Transport", "Monthly transit pass", 5),
	makeSeedTx("seed-5", "income", 350, "Freelance", "Logo design project", 7),
	makeSeedTx("seed-6", "expense", 120, "Entertainment", "Concert tickets", 8),
	makeSeedTx("seed-7", "expense", 65, "Healthcare", "Pharmacy", 10),
	makeSeedTx("seed-8", "expense", 200, "Shopping", "Winter jacket", 12),
	makeSeedTx("seed-9", "income", 180, "Investment", "Dividend payment", 14),
	makeSeedTx("seed-10", "expense", 55.75, "Food & Dining", "Dinner out", 15),
];

interface TransactionState {
	transactions: Transaction[];
}

export const transactionStore = new Store<TransactionState>({
	transactions: seedTransactions,
});

export function addTransaction(transaction: Transaction): void {
	transactionStore.setState((state) => ({
		...state,
		transactions: [transaction, ...state.transactions],
	}));
}

export function removeTransaction(id: string): void {
	transactionStore.setState((state) => ({
		...state,
		transactions: state.transactions.filter((t) => t.id !== id),
	}));
}
