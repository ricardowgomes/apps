/**
 * Integration tests for the React Query hook wrappers in use-portfolio.ts.
 *
 * Same mocking strategy as the other hook integration tests.
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

vi.mock("./portfolio-server-fns", () => ({
	getPortfolioEntriesFn: vi.fn(),
	createPortfolioEntryFn: vi.fn(),
	updatePortfolioEntryFn: vi.fn(),
	deletePortfolioEntryFn: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	createPortfolioEntryFn,
	deletePortfolioEntryFn,
	getPortfolioEntriesFn,
	updatePortfolioEntryFn,
} from "./portfolio-server-fns";
import {
	useAddPortfolioEntry,
	usePortfolioEntries,
	useRemovePortfolioEntry,
	useUpdatePortfolioEntry,
} from "./use-portfolio";

// ── Helpers ──────────────────────────────────────────────────────────────────
const PORTFOLIO_KEY = ["portfolio"];

function makeEntryInput() {
	return {
		type: "investment" as const,
		name: "XEQT ETF",
		monthly_amount: 500,
		interest_rate: 7,
		total_amount: 20000,
		currency: "CAD",
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── usePortfolioEntries ──────────────────────────────────────────────────────
describe("usePortfolioEntries", () => {
	it("calls useSuspenseQuery with the portfolio query key", () => {
		const fakeData = [{ id: "pe-1", ...makeEntryInput() }];
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: fakeData } as never);

		const result = usePortfolioEntries();

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: PORTFOLIO_KEY }),
		);
		expect(result).toBe(fakeData);
	});

	it("queryFn delegates to getPortfolioEntriesFn", () => {
		let capturedQueryFn: (() => unknown) | undefined;
		vi.mocked(useSuspenseQuery).mockImplementation(({ queryFn }) => {
			capturedQueryFn = queryFn as () => unknown;
			return { data: [] } as never;
		});
		const mockReturn = [{ id: "pe-1" }];
		vi.mocked(getPortfolioEntriesFn).mockReturnValue(mockReturn as never);

		usePortfolioEntries();
		capturedQueryFn?.();

		expect(getPortfolioEntriesFn).toHaveBeenCalled();
	});
});

// ── useAddPortfolioEntry ─────────────────────────────────────────────────────
describe("useAddPortfolioEntry", () => {
	it("returns a function that calls mutateAsync with the input", async () => {
		const mockMutateAsync = vi.fn().mockResolvedValue({});
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);

		const add = useAddPortfolioEntry();
		const input = makeEntryInput();
		await add(input);

		expect(mockMutateAsync).toHaveBeenCalledWith(input);
	});

	it("mutationFn calls createPortfolioEntryFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: vi.fn() } as never;
		});
		vi.mocked(createPortfolioEntryFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useAddPortfolioEntry();
		const input = makeEntryInput();
		capturedMutationFn?.(input);

		expect(createPortfolioEntryFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the portfolio query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: vi.fn() } as never;
		});

		useAddPortfolioEntry();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: PORTFOLIO_KEY,
		});
	});
});

// ── useUpdatePortfolioEntry ──────────────────────────────────────────────────
describe("useUpdatePortfolioEntry", () => {
	it("returns a function that calls mutateAsync", async () => {
		const mockMutateAsync = vi.fn().mockResolvedValue({});
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);

		const update = useUpdatePortfolioEntry();
		const input = { id: "pe-1", ...makeEntryInput() };
		await update(input);

		expect(mockMutateAsync).toHaveBeenCalledWith(input);
	});

	it("mutationFn calls updatePortfolioEntryFn with wrapped data", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutateAsync: vi.fn() } as never;
		});
		vi.mocked(updatePortfolioEntryFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useUpdatePortfolioEntry();
		const input = { id: "pe-1", ...makeEntryInput() };
		capturedMutationFn?.(input);

		expect(updatePortfolioEntryFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates the portfolio query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: vi.fn() } as never;
		});

		useUpdatePortfolioEntry();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: PORTFOLIO_KEY,
		});
	});
});

// ── useRemovePortfolioEntry ──────────────────────────────────────────────────
describe("useRemovePortfolioEntry", () => {
	it("returns a function that calls mutateAsync with the id", async () => {
		const mockMutateAsync = vi.fn().mockResolvedValue({});
		vi.mocked(useMutation).mockReturnValue({
			mutateAsync: mockMutateAsync,
		} as never);

		const remove = useRemovePortfolioEntry();
		await remove("pe-99");

		expect(mockMutateAsync).toHaveBeenCalledWith("pe-99");
	});

	it("mutationFn calls deletePortfolioEntryFn with wrapped id", () => {
		let capturedMutationFn: ((id: string) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (id: string) => unknown;
			return { mutateAsync: vi.fn() } as never;
		});
		vi.mocked(deletePortfolioEntryFn).mockReturnValue(
			Promise.resolve({}) as never,
		);

		useRemovePortfolioEntry();
		capturedMutationFn?.("pe-99");

		expect(deletePortfolioEntryFn).toHaveBeenCalledWith({
			data: { id: "pe-99" },
		});
	});

	it("onSuccess invalidates the portfolio query key", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutateAsync: vi.fn() } as never;
		});

		useRemovePortfolioEntry();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: PORTFOLIO_KEY,
		});
	});
});
