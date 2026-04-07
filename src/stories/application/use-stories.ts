import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	deleteStoryFn,
	generateStoryFn,
	getStoriesFn,
	getStoryFn,
} from "./story-server-fns";

// ── Query keys ───────────────────────────────────────────────────────────────

export const storiesKeys = {
	all: ["stories"] as const,
	detail: (id: string) => ["stories", id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useStories() {
	const { data } = useSuspenseQuery({
		queryKey: storiesKeys.all,
		queryFn: () => getStoriesFn(),
	});
	return data;
}

export function useStory(storyId: string) {
	const { data } = useSuspenseQuery({
		queryKey: storiesKeys.detail(storyId),
		queryFn: () => getStoryFn({ data: { storyId } }),
	});
	return data;
}

export function useGenerateStory() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: (prompt: string) => generateStoryFn({ data: { prompt } }),
		onSuccess: async ({ storyId }) => {
			await queryClient.invalidateQueries({ queryKey: storiesKeys.all });
			navigate({ to: "/stories/$storyId", params: { storyId } });
		},
	});
}

export function useDeleteStory() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: (storyId: string) => deleteStoryFn({ data: { storyId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: storiesKeys.all });
			navigate({ to: "/stories/" });
		},
	});
}
