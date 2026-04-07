/**
 * Integration tests for the React Query hook wrappers in use-stories.ts.
 *
 * Same mocking strategy as the other hook integration tests.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks ───────────────────────────────────────────────────────────
const { mockInvalidateQueries, mockNavigate, mockQueryClient } = vi.hoisted(
	() => {
		const mockInvalidateQueries = vi.fn();
		const mockNavigate = vi.fn();
		return {
			mockInvalidateQueries,
			mockNavigate,
			mockQueryClient: { invalidateQueries: mockInvalidateQueries },
		};
	},
);

vi.mock("@tanstack/react-query", () => ({
	useSuspenseQuery: vi.fn(),
	useMutation: vi.fn(),
	useQueryClient: vi.fn(() => mockQueryClient),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("./story-server-fns", () => ({
	getStoriesFn: vi.fn(),
	getStoryFn: vi.fn(),
	generateStoryFn: vi.fn(),
	deleteStoryFn: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	deleteStoryFn,
	generateStoryFn,
	getStoriesFn,
	getStoryFn,
} from "./story-server-fns";
import {
	storiesKeys,
	useDeleteStory,
	useGenerateStory,
	useStories,
	useStory,
} from "./use-stories";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeStorySummary(id = "story-1") {
	return {
		id,
		title: "The Brave Little Fox",
		coverImageUrl: null,
		createdAt: new Date("2026-01-01"),
		createdBy: "test@example.com",
		sceneCount: 4,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ── storiesKeys ───────────────────────────────────────────────────────────────

describe("storiesKeys", () => {
	it("all returns ['stories']", () => {
		expect(storiesKeys.all).toEqual(["stories"]);
	});

	it("detail returns ['stories', id]", () => {
		expect(storiesKeys.detail("story-abc")).toEqual(["stories", "story-abc"]);
	});
});

// ── useStories ───────────────────────────────────────────────────────────────

describe("useStories", () => {
	it("calls useSuspenseQuery with the stories query key", () => {
		const fakeData = [makeStorySummary()];
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: fakeData } as never);

		const result = useStories();

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: storiesKeys.all }),
		);
		expect(result).toBe(fakeData);
	});

	it("queryFn delegates to getStoriesFn", () => {
		let capturedQueryFn: (() => unknown) | undefined;
		vi.mocked(useSuspenseQuery).mockImplementation(({ queryFn }) => {
			capturedQueryFn = queryFn as () => unknown;
			return { data: [] } as never;
		});
		vi.mocked(getStoriesFn).mockReturnValue([] as never);

		useStories();
		capturedQueryFn?.();

		expect(getStoriesFn).toHaveBeenCalled();
	});
});

// ── useStory ─────────────────────────────────────────────────────────────────

describe("useStory", () => {
	it("calls useSuspenseQuery with the story detail key", () => {
		const fakeStory = { id: "story-1", title: "Test", scenes: [] };
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: fakeStory } as never);

		const result = useStory("story-1");

		expect(useSuspenseQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: storiesKeys.detail("story-1") }),
		);
		expect(result).toBe(fakeStory);
	});

	it("queryFn calls getStoryFn with wrapped storyId", () => {
		let capturedQueryFn: (() => unknown) | undefined;
		vi.mocked(useSuspenseQuery).mockImplementation(({ queryFn }) => {
			capturedQueryFn = queryFn as () => unknown;
			return { data: null } as never;
		});
		vi.mocked(getStoryFn).mockReturnValue(null as never);

		useStory("story-42");
		capturedQueryFn?.();

		expect(getStoryFn).toHaveBeenCalledWith({ data: { storyId: "story-42" } });
	});
});

// ── useGenerateStory ──────────────────────────────────────────────────────────

describe("useGenerateStory", () => {
	it("returns the mutation object from useMutation", () => {
		const fakeMutation = { mutate: vi.fn(), isPending: false };
		vi.mocked(useMutation).mockReturnValue(fakeMutation as never);

		const result = useGenerateStory();

		expect(result).toBe(fakeMutation);
	});

	it("mutationFn calls generateStoryFn with wrapped prompt", () => {
		let capturedMutationFn: ((prompt: string) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (prompt: string) => unknown;
			return { mutate: vi.fn() } as never;
		});
		vi.mocked(generateStoryFn).mockResolvedValue({
			storyId: "s-1",
			story: {} as never,
		} as never);

		useGenerateStory();
		capturedMutationFn?.("A dragon who is afraid of fire");

		expect(generateStoryFn).toHaveBeenCalledWith({
			data: { prompt: "A dragon who is afraid of fire" },
		});
	});

	it("onSuccess invalidates stories and navigates to viewer", async () => {
		let capturedOnSuccess:
			| (({ storyId }: { storyId: string }) => Promise<void>)
			| undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as typeof capturedOnSuccess;
			return { mutate: vi.fn() } as never;
		});
		mockInvalidateQueries.mockResolvedValue(undefined);

		useGenerateStory();
		await capturedOnSuccess?.({ storyId: "s-new" });

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: storiesKeys.all,
		});
		expect(mockNavigate).toHaveBeenCalledWith({
			to: "/stories/$storyId",
			params: { storyId: "s-new" },
		});
	});
});

// ── useDeleteStory ────────────────────────────────────────────────────────────

describe("useDeleteStory", () => {
	it("returns the mutation object from useMutation", () => {
		const fakeMutation = { mutate: vi.fn(), isPending: false };
		vi.mocked(useMutation).mockReturnValue(fakeMutation as never);

		const result = useDeleteStory();

		expect(result).toBe(fakeMutation);
	});

	it("mutationFn calls deleteStoryFn with wrapped storyId", () => {
		let capturedMutationFn: ((storyId: string) => unknown) | undefined;
		vi.mocked(useMutation).mockImplementation(({ mutationFn }) => {
			capturedMutationFn = mutationFn as (storyId: string) => unknown;
			return { mutate: vi.fn() } as never;
		});
		vi.mocked(deleteStoryFn).mockResolvedValue(undefined as never);

		useDeleteStory();
		capturedMutationFn?.("story-to-delete");

		expect(deleteStoryFn).toHaveBeenCalledWith({
			data: { storyId: "story-to-delete" },
		});
	});

	it("onSuccess invalidates stories and navigates to library", async () => {
		let capturedOnSuccess: (() => Promise<void>) | undefined;
		vi.mocked(useMutation).mockImplementation(({ onSuccess }) => {
			capturedOnSuccess = onSuccess as () => Promise<void>;
			return { mutate: vi.fn() } as never;
		});
		mockInvalidateQueries.mockResolvedValue(undefined);

		useDeleteStory();
		await capturedOnSuccess?.();

		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: storiesKeys.all,
		});
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/stories/" });
	});
});
