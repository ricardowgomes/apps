import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,

		context: {
			...getContext(),
			user: null,
		},

		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
		server: {
			requestContext: {
				cloudflare: {
					env: Env;
				};
			};
		};
	}
}

declare module "@tanstack/router-core" {
	interface Register {
		server: {
			requestContext: {
				cloudflare: {
					env: Env;
				};
			};
		};
	}
}
