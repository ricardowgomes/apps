/**
 * Integration tests for the React Query hook wrappers in use-transactions.ts.
 *
 * Strategy: mock @tanstack/react-query so hooks execute synchronously in the
 * Node environment (no DOM required), then verify each hook configures the
 * right query key, delegates to the right server function, and invalidates the
 * cache on success.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks ───────────────────────────────────────────────────────────
// vi.hoisted() runs before vi.mock() factory evaluation, so the refs are
// available inside the mock factories below.

const { mockInvalidateQueries, mockQueryClient, mockMutateAsync } = vi.hoisted(
	() => {
		const mockInvalidateQueries = vi.fn();
		const mockMutateAsync = vi.fn();
		return {
			mockInvalidateQueries,
			mockMutateAsync,
			mockQueryClient: { invalidateQueries: mockInvalidateQueries },
		};
	},
);

vi.mock("@tanstack/react-query", () => ({
	useSuspenseQuery: vi.fn(),
	useMutation: vi.fn(),
	useQueryClient: vi.fn(() => mockQueryClient),
}));

vi.mock("./transaction-server-fns", () => ({
	getTransactionsFn: vi.fn(),
	createTransactionFn: vi.fn(),
	updateTransactionFn: vi.fn(),
	deleteTransactionFn: vi.fn(),
	updateCategoryByDescriptionFn: vi.fn(),
	bulkImportTransactionsFn: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	bulkImportTransactionsFn,
	createTransactionFn,
	deleteTransactionFn,
	getTransactionsFn,
	updateCategoryByDescriptionFn,
	updateTransactionFn,
} from "./transaction-server-fns";
import {
	useAddTransaction,
	useImportTransactions,
	useRemoveTransaction,
	useTransactions,
	useUpdateCategoryByDescription,
	useUpdateTransaction,
} from "./use-transactions";

// ── Helpers ──────────────────────────────────────────────────────────────────
const TRANSACTIONS_KEY = ["transactions"];

function makeTxInput() {
	return {
		type: "expense" as const,
		amount: 50,
		currency: "CAD",
		category: "Food & Dining",
		description: "Lunch",
		date: "2026-01-15",
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── useTransactions ──────────────────────────────────────────────────────────
describe("useTransactions", () => {
	it("calls useSuspenseQuery with the transactions query key", () => {
		const fakeData = [{ id: "1", ...makeTxInput(), createdAt: "" }];
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: fakeData } as never);

		const result = useTransactions();

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: TRANSACTIONS_KEY }),
		);
		expect(result).toBe(fakeData);
	});

	it("queryFn delegates to getTransactionsFn", () => {
		let capturedQueryFn: (() => unknown) | undefined;
		vi.mocked(useSuspenseQuery).mockImplementation(({ queryFn }) => {
			capturedQueryFn = queryFn as () => unknown;
			return { data: [] } as never;
		});
		const mockReturn = [{ id: "tx-1" }];
		vi.mocked(getTransactionsFn).mockReturnValue(mockReturn as never);

		useTransactions();
		capturedQueryFn?.();

		expect(getTransactionsFn).toHaveBeenCalled();
	});
});

// ── useAddTransaction ────────────────────────────────────────────────────────
describe("useAddTransaction", () => {
	it("returns a function that calls mutateAsync with the input", async () => {
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);
		mockMutateAsync.mockResolvedValue({});

		const add = useAddTransaction();
		const input = makeTxInput();
		await add(input);

		expect(mockMutateAsync).toHaveBeenCalledWith(input);
	});

	it("mutationFn calls createTransactionFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: mockMutateAsync } as never;
		});
		vi.mocked(createTransactionFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useAddTransaction();
		const input = makeTxInput();
		capturedMutationFn?.(input);

		expect(createTransactionFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the transactions query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: mockMutateAsync } as never;
		});

		useAddTransaction();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: TRANSACTIONS_KEY,
		});
	});
});

// ── useUpdateTransaction ─────────────────────────────────────────────────────
describe("useUpdateTransaction", () => {
	it("returns a function that calls mutateAsync", async () => {
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);
		mockMutateAsync.mockResolvedValue({});

		const update = useUpdateTransaction();
		const input = { id: "tx-1", ...makeTxInput() };
		await update(input);

		expect(mockMutateAsync).toHaveBeenCalledWith(input);
	});

	it("mutationFn calls updateTransactionFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: mockMutateAsync } as never;
		});
		vi.mocked(updateTransactionFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useUpdateTransaction();
		const input = { id: "tx-1", ...makeTxInput() };
		capturedMutationFn?.(input);

		expect(updateTransactionFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the transactions query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: mockMutateAsync } as never;
		});

		useUpdateTransaction();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: TRANSACTIONS_KEY,
		});
	});
});

// ── useRemoveTransaction ─────────────────────────────────────────────────────
describe("useRemoveTransaction", () => {
	it("returns a function that calls mutateAsync with the id", async () => {
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);
		mockMutateAsync.mockResolvedValue({});

		const remove = useRemoveTransaction();
		await remove("tx-123");

		expect(mockMutateAsync).toHaveBeenCalledWith("tx-123");
	});

	it("mutationFn calls deleteTransactionFn with wrapped id", () => {
		let capturedMutationFn: ((id: string) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (id: string) => unknown;
			return { mutateAsync: mockMutateAsync } as never;
		});
		vi.mocked(deleteTransactionFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useRemoveTransaction();
		capturedMutationFn?.("tx-999");

		expect(deleteTransactionFn).toHaveBeenCalledWith({
			data: { id: "tx-999" },
		});
	});

	it("onSuccess invalidates the transactions query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: mockMutateAsync } as never;
		});

		useRemoveTransaction();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: TRANSACTIONS_KEY,
		});
	});
});

// ── useUpdateCategoryByDescription ───────────────────────────────────────────
describe("useUpdateCategoryByDescription", () => {
	it("returns a function that calls mutateAsync", async () => {
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);
		mockMutateAsync.mockResolvedValue({});

		const updateCat = useUpdateCategoryByDescription();
		const input = { description: "Starbucks", category: "Food & Dining" };
		await updateCat(input);

		expect(mockMutateAsync).toHaveBeenCalledWith(input);
	});

	it("mutationFn calls updateCategoryByDescriptionFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: mockMutateAsync } as never;
		});
		vi.mocked(updateCategoryByDescriptionFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useUpdateCategoryByDescription();
		const input = { description: "Starbucks", category: "Food & Dining" };
		capturedMutationFn?.(input);

		expect(updateCategoryByDescriptionFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the transactions query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: mockMutateAsync } as never;
		});

		useUpdateCategoryByDescription();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: TRANSACTIONS_KEY,
		});
	});
});

// ── useImportTransactions ────────────────────────────────────────────────────
describe("useImportTransactions", () => {
	it("returns the mutation object directly", () => {
		const fakeMutation = { mutateAsync: mockMutateAsync, isPending: false };
		vi.mocked(useMutation).mockReturnValue(fakeMutation as never);

		const result = useImportTransactions();

		expect(result).toBe(fakeMutation);
	});

	it("mutationFn calls bulkImportTransactionsFn with wrapped transactions", () => {
		let capturedMutationFn: ((txs: unknown[]) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (txs: unknown[]) => unknown;
			return { mutateAsync: mockMutateAsync } as never;
		});
		vi.mocked(bulkImportTransactionsFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useImportTransactions();
		const txs = [{ id: "tx-1", ...makeTxInput(), createdAt: "" }];
		capturedMutationFn?.(txs);

		expect(bulkImportTransactionsFn).toHaveBeenCalledWith({
			data: { transactions: txs },
		});
	});

	it("onSuccess invalidates the transactions query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: mockMutateAsync } as never;
		});

		useImportTransactions();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: TRANSACTIONS_KEY,
		});
	});
});
