import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoriesFn } from "@/stories/application/story-server-fns";
import { storiesKeys } from "@/stories/application/use-stories";
import { StoriesPage } from "@/stories/ui/StoriesPage";

export const Route = createFileRoute("/stories/")({
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: storiesKeys.all,
			queryFn: () => getStoriesFn(),
		});
	},
	component: StoriesPage,
});
