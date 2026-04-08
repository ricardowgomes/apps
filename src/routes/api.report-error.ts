import { createFileRoute } from "@tanstack/react-router";
import { reportError } from "@/observability/error-reporter";

interface ClientErrorPayload {
	message?: string;
	stack?: string;
	route?: string;
}

export const Route = createFileRoute("/api/report-error")({
	server: {
		handlers: {
			POST: async ({ request, context }) => {
				const body = (await request.json()) as ClientErrorPayload;

				await reportError(
					context.cloudflare.env,
					new Error(body.message ?? "Client-side error (no message)"),
					{ route: body.route, handler: "ErrorBoundary" },
				);

				return new Response(null, { status: 204 });
			},
		},
	},
});
