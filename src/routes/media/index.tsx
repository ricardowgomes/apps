import { createFileRoute, redirect } from "@tanstack/react-router";
import { searchMediaFn } from "@/media/application/media-server-fns";
import { mediaKeys } from "@/media/application/use-media";
import { MediaPage } from "@/media/ui/MediaPage";

export const Route = createFileRoute("/media/")({
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/login" });
		}
	},
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: mediaKeys.search({}),
			queryFn: () => searchMediaFn({ data: {} }),
		});
	},
	component: MediaPage,
});
