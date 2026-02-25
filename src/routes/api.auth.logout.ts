import { getCloudflareContext } from "@cloudflare/vite-plugin";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { SESSION_COOKIE_NAME } from "@/auth/domain/session";
import { deleteById } from "@/auth/infrastructure/d1-session-repository";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
	POST: async ({ request }) => {
		const { env } = await getCloudflareContext<Env>();
		const cookies = parseCookies(request.headers.get("Cookie") ?? "");
		const sessionId = cookies[SESSION_COOKIE_NAME];

		if (sessionId) {
			await deleteById(env.DB, sessionId);
		}

		return new Response(null, {
			status: 302,
			headers: {
				Location: "/login",
				"Set-Cookie": `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
			},
		});
	},
});

function parseCookies(cookieHeader: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const part of cookieHeader.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key) {
			result[key.trim()] = rest.join("=").trim();
		}
	}
	return result;
}
