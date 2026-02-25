import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { getLocale } from "#/paraglide/runtime";
import type { SessionUser } from "@/auth/domain/session";
import BottomNav from "../components/BottomNav";
import PortfolioHeader from "../components/PortfolioHeader";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	user: SessionUser | null;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		// Other redirect strategies are possible; see
		// https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", getLocale());
		}
		// Dynamic import prevents session-server-fns.ts from being evaluated at
		// module initialisation time. __root.tsx is eagerly loaded by routeTree.gen.ts,
		// and createServerFn() fails in the Cloudflare Workers module runner when called
		// at startup. Importing lazily here defers evaluation to request-handling time,
		// when the runtime is fully initialised — the same reason finance route fns work.
		const { getSessionFn } = await import(
			"@/auth/application/session-server-fns"
		);
		const user = await getSessionFn();
		return { user };
	},

	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Ricardo Gomes — Software Engineer",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { user } = Route.useRouteContext();
	return (
		<html lang={getLocale()} className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="bg-[#05080d]">
				<TanStackQueryProvider>
					<PortfolioHeader user={user} />
					{children}
					<BottomNav />
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</TanStackQueryProvider>
				<Scripts />
			</body>
		</html>
	);
}
