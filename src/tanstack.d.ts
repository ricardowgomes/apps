// Module augmentation for TanStack Router core — typed Cloudflare context.
// Must be a module file (export {}) so this is a proper augmentation, not an ambient declaration.
export {};

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
