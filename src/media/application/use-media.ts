import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type {
	CreateMediaItemInput,
	MediaSearchParams,
	UpdateMediaItemInput,
} from "../domain/media-item";
import {
	createMediaItemFn,
	deleteMediaItemFn,
	searchMediaFn,
	updateMediaItemFn,
} from "./media-server-fns";

// ── Query keys ────────────────────────────────────────────────────────────────

export const mediaKeys = {
	all: ["media"] as const,
	search: (params: MediaSearchParams) => ["media", "search", params] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMediaItems(params: MediaSearchParams = {}) {
	const { data } = useSuspenseQuery({
		queryKey: mediaKeys.search(params),
		queryFn: () => searchMediaFn({ data: params }),
	});
	return data;
}

export function useCreateMediaItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateMediaItemInput) =>
			createMediaItemFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: mediaKeys.all });
		},
	});
}

export function useUpdateMediaItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateMediaItemInput) =>
			updateMediaItemFn({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: mediaKeys.all });
		},
	});
}

export function useDeleteMediaItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteMediaItemFn({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: mediaKeys.all });
		},
	});
}
