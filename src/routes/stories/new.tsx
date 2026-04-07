import { createFileRoute, redirect } from "@tanstack/react-router";
import { NewStoryPage } from "@/stories/ui/NewStoryPage";

export const Route = createFileRoute("/stories/new")({
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			throw redirect({ to: "/login" });
		}
	},
	component: NewStoryPage,
});
