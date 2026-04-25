import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
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

vi.mock("./media-server-fns", () => ({
	searchMediaFn: vi.fn(),
	createMediaItemFn: vi.fn(),
	updateMediaItemFn: vi.fn(),
	deleteMediaItemFn: vi.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	createMediaItemFn,
	deleteMediaItemFn,
	searchMediaFn,
	updateMediaItemFn,
} from "./media-server-fns";
import {
	mediaKeys,
	useCreateMediaItem,
	useDeleteMediaItem,
	useMediaItems,
	useUpdateMediaItem,
} from "./use-media";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMediaItem(id = "m-1") {
	return {
		id,
		type: "movie" as const,
		title: "Inception",
		description: null,
		year: 2010,
		posterUrl: null,
		status: "done" as const,
		rating: 5,
		notes: null,
		genres: ["Sci-Fi"],
		directors: ["Christopher Nolan"],
		castMembers: [],
		artists: [],
		album: null,
		addedBy: "user@example.com",
		addedAt: new Date("2026-01-01"),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── mediaKeys ─────────────────────────────────────────────────────────────────

describe("mediaKeys", () => {
	it("all is ['media']", () => {
		expect(mediaKeys.all).toEqual(["media"]);
	});

	it("search includes params in the key", () => {
		expect(mediaKeys.search({ type: "movie" })).toEqual([
			"media",
			"search",
			{ type: "movie" },
		]);
	});
});

// ── useMediaItems ─────────────────────────────────────────────────────────────

describe("useMediaItems", () => {
	it("calls useSuspenseQuery with the search key for given params", () => {
		const fakeData = [makeMediaItem()];
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: fakeData } as never);

		const result = useMediaItems({ type: "movie" });

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: mediaKeys.search({ type: "movie" }),
			}),
		);
		expect(result).toBe(fakeData);
	});

	it("defaults to empty params when none provided", () => {
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: [] } as never);

		useMediaItems();

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: mediaKeys.search({}) }),
		);
	});

	it("queryFn delegates to searchMediaFn with data wrapper", () => {
		let capturedQueryFn: (() => unknown) | undefined;
		vi.mocked(useSuspenseQuery).mockImplementation(({ queryFn }) => {
			capturedQueryFn = queryFn as () => unknown;
			return { data: [] } as never;
		});
		vi.mocked(searchMediaFn).mockReturnValue([] as never);

		useMediaItems({ type: "music" });
		capturedQueryFn?.();

		expect(searchMediaFn).toHaveBeenCalledWith({ data: { type: "music" } });
	});
});

// ── useCreateMediaItem ────────────────────────────────────────────────────────

describe("useCreateMediaItem", () => {
	it("returns the mutation object from useMutation", () => {
		const fakeMutation = { mutate: vi.fn(), isPending: false };
		vi.mocked(useMutation).mockReturnValue(fakeMutation as never);

		const result = useCreateMediaItem();

		expect(result).toBe(fakeMutation);
	});

	it("mutationFn calls createMediaItemFn with wrapped input", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutate: vi.fn() } as never;
		});
		vi.mocked(createMediaItemFn).mockResolvedValue("new-id" as never);

		useCreateMediaItem();
		const input = { type: "music", title: "OK Computer" };
		capturedMutationFn?.(input);

		expect(createMediaItemFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates all media queries", async () => {
		let capturedOnSuccess: (() => void) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => void;
			return { mutate: vi.fn() } as never;
		});
		mockInvalidateQueries.mockResolvedValue(undefined);

		useCreateMediaItem();
		capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: mediaKeys.all,
		});
	});
});

// ── useUpdateMediaItem ────────────────────────────────────────────────────────

describe("useUpdateMediaItem", () => {
	it("mutationFn calls updateMediaItemFn with wrapped input", () => {
		let capturedMutationFn: ((input: unknown) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (input: unknown) => unknown;
			return { mutate: vi.fn() } as never;
		});
		vi.mocked(updateMediaItemFn).mockResolvedValue(undefined as never);

		useUpdateMediaItem();
		const input = { id: "m-1", status: "done" };
		capturedMutationFn?.(input);

		expect(updateMediaItemFn).toHaveBeenCalledWith({ data: input });
	});

	it("onSuccess invalidates all media queries", async () => {
		let capturedOnSuccess: (() => void) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => void;
			return { mutate: vi.fn() } as never;
		});
		mockInvalidateQueries.mockResolvedValue(undefined);

		useUpdateMediaItem();
		capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: mediaKeys.all,
		});
	});
});

// ── useDeleteMediaItem ────────────────────────────────────────────────────────

describe("useDeleteMediaItem", () => {
	it("mutationFn calls deleteMediaItemFn with wrapped id", () => {
		let capturedMutationFn: ((id: string) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (id: string) => unknown;
			return { mutate: vi.fn() } as never;
		});
		vi.mocked(deleteMediaItemFn).mockResolvedValue(undefined as never);

		useDeleteMediaItem();
		capturedMutationFn?.("m-1");

		expect(deleteMediaItemFn).toHaveBeenCalledWith({ data: { id: "m-1" } });
	});

	it("onSuccess invalidates all media queries", async () => {
		let capturedOnSuccess: (() => void) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => void;
			return { mutate: vi.fn() } as never;
		});
		mockInvalidateQueries.mockResolvedValue(undefined);

		useDeleteMediaItem();
		capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: mediaKeys.all,
		});
	});
});
