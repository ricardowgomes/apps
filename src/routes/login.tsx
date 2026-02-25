import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LoginPage } from "@/auth/ui/LoginPage";

export const Route = createFileRoute("/login")({
	validateSearch: z.object({ redirect: z.string().optional() }),
	beforeLoad: async ({ context }) => {
		if (context.user) {
			throw redirect({ to: "/finance" });
		}
	},
	component: LoginPage,
});
