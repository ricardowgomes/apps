/**
 * Preload script for Vitest (used via poolOptions.forks.execArgv --require).
 *
 * Patches Node.js module resolution BEFORE any test code (or jsdom) loads,
 * redirecting all @exodus/bytes/* requires to CJS-compatible shims.
 * This fixes a jsdom 27 / Node 20 incompatibility where multiple CJS modules
 * inside jsdom try to require() ESM-only packages from @exodus/bytes.
 */
"use strict";

const Module = require("node:module");
const path = require("node:path");

const SHIMS = {
	encodingLite: path.resolve(__dirname, "shims/encoding-lite.cjs"),
	encoding: path.resolve(__dirname, "shims/encoding.cjs"),
};

const originalLoad = Module._load;
Module._load = function interceptLoad(request, parent, isMain) {
	// Redirect @exodus/bytes/encoding-lite.js → CJS shim
	if (
		request === "@exodus/bytes/encoding-lite.js" ||
		(request.includes("@exodus/bytes") && request.includes("encoding-lite"))
	) {
		return originalLoad(SHIMS.encodingLite, parent, isMain);
	}
	// Redirect @exodus/bytes/encoding.js (and full resolved paths) → CJS shim
	if (
		request === "@exodus/bytes/encoding.js" ||
		(request.includes("@exodus") &&
			request.includes("bytes") &&
			request.includes("encoding") &&
			!request.includes("encoding-lite"))
	) {
		return originalLoad(SHIMS.encoding, parent, isMain);
	}
	return originalLoad(request, parent, isMain);
};
