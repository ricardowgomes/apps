import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoryFn } from "@/stories/application/story-server-fns";
import { storiesKeys } from "@/stories/application/use-stories";
import { StoryViewerPage } from "@/stories/ui/StoryViewerPage";

export const Route = createFileRoute("/stories/$storyId")({
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context: { queryClient }, params }) => {
		await queryClient.ensureQueryData({
			queryKey: storiesKeys.detail(params.storyId),
			queryFn: () => getStoryFn({ data: { storyId: params.storyId } }),
		});
	},
	component: function StoryRoute() {
		const { storyId } = Route.useParams();
		return <StoryViewerPage storyId={storyId} />;
	},
});
