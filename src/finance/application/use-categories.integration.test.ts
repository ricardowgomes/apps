/**
 * Integration tests for the React Query hook wrappers in use-categories.ts.
 *
 * Same mocking strategy as use-transactions.integration.test.ts: mock
 * @tanstack/react-query so hooks run synchronously in the Node environment,
 * then verify query keys, server-fn delegation, and cache invalidation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks ───────────────────────────────────────────────────────────
const { mockInvalidateQueries, mockQueryClient } = vi.hoisted(() => {
	const mockInvalidateQueries = vi.fn();
	return {
		mockInvalidateQueries,
		mockQueryClient: { invalidateQueries: mockInvalidateQueries },
	};
});

vi.mock("@tanstack/react-query", () => ({
	useSuspenseQuery: vi.fn(),
	useMutation: vi.fn(),
	useQueryClient: vi.fn(() => mockQueryClient),
}));

vi.mock("./category-server-fns", () => ({
	getCategoriesFn: vi.fn(),
	createCategoryFn: vi.fn(),
	updateCategoryFn: vi.fn(),
	deleteCategoryFn: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	createCategoryFn,
	deleteCategoryFn,
	getCategoriesFn,
	updateCategoryFn,
} from "./category-server-fns";
import {
	useAddCategory,
	useCategories,
	useRemoveCategory,
	useUpdateCategory,
} from "./use-categories";

// ── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORIES_KEY = ["categories"];

function makeCategoryInput() {
	return {
		name: "Groceries",
		icon: "🛒",
		color: "#6366f1",
		keywords: ["walmart", "loblaws"],
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── useCategories ────────────────────────────────────────────────────────────
describe("useCategories", () => {
	it("calls useSuspenseQuery with the categories query key", () => {
		const fakeResult = { data: [] };
		vi.mocked(useSuspenseQuery).mockReturnValue(fakeResult as never);

		const result = useCategories();

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: CATEGORIES_KEY }),
		);
		expect(result).toBe(fakeResult);
	});

	it("queryFn delegates to getCategoriesFn", () => {
		let capturedQueryFn: (() => unknown) | undefined;
		vi.mocked(useSuspenseQuery).mockImplementation(({ queryFn }) => {
			capturedQueryFn = queryFn as () => unknown;
			return { data: [] } as never;
		});
		const mockReturn = [{ id: "cat-1", name: "Groceries" }];
		vi.mocked(getCategoriesFn).mockReturnValue(mockReturn as never);

		useCategories();
		capturedQueryFn?.();

		expect(getCategoriesFn).toHaveBeenCalled();
	});
});

// ── useAddCategory ───────────────────────────────────────────────────────────
describe("useAddCategory", () => {
	it("returns mutateAsync directly", () => {
		const mockMutateAsync = vi.fn();
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);

		const add = useAddCategory();

		expect(add).toBe(mockMutateAsync);
	});

	it("mutationFn calls createCategoryFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: vi.fn() } as never;
		});
		vi.mocked(createCategoryFn).mockReturnValue(Promise.resolve({}) as never);

		useAddCategory();
		const input = makeCategoryInput();
		capturedMutationFn?.(input);

		expect(createCategoryFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the categories query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: vi.fn() } as never;
		});

		useAddCategory();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: CATEGORIES_KEY,
		});
	});
});

// ── useUpdateCategory ────────────────────────────────────────────────────────
describe("useUpdateCategory", () => {
	it("returns mutateAsync directly", () => {
		const mockMutateAsync = vi.fn();
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);

		const update = useUpdateCategory();

		expect(update).toBe(mockMutateAsync);
	});

	it("mutationFn calls updateCategoryFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: vi.fn() } as never;
		});
		vi.mocked(updateCategoryFn).mockReturnValue(Promise.resolve({}) as never);

		useUpdateCategory();
		const input = { id: "cat-1", ...makeCategoryInput() };
		capturedMutationFn?.(input);

		expect(updateCategoryFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the categories query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: vi.fn() } as never;
		});

		useUpdateCategory();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: CATEGORIES_KEY,
		});
	});
});

// ── useRemoveCategory ────────────────────────────────────────────────────────
describe("useRemoveCategory", () => {
	it("returns mutateAsync directly", () => {
		const mockMutateAsync = vi.fn();
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);

		const remove = useRemoveCategory();

		expect(remove).toBe(mockMutateAsync);
	});

	it("mutationFn calls deleteCategoryFn with wrapped id", () => {
		let capturedMutationFn: ((id: string) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (id: string) => unknown;
			return { mutateAsync: vi.fn() } as never;
		});
		vi.mocked(deleteCategoryFn).mockReturnValue(Promise.resolve({}) as never);

		useRemoveCategory();
		capturedMutationFn?.("cat-99");

		expect(deleteCategoryFn).toHaveBeenCalledWith({ data: { id: "cat-99" } });
	});

	it("onSuccess invalidates the categories query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: vi.fn() } as never;
		});

		useRemoveCategory();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: CATEGORIES_KEY,
		});
	});
});
