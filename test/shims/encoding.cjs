/**
 * CJS shim for @exodus/bytes/encoding.js
 *
 * jsdom 27 requires this ESM-only module from multiple CJS files.
 * Provides the same API surface using Node.js built-ins.
 */
"use strict";

const { TextDecoder, TextEncoder } = require("node:util");

const LABEL_MAP = {
	"utf-8": "utf-8",
	utf8: "utf-8",
	"unicode-1-1-utf-8": "utf-8",
	"utf-16le": "utf-16le",
	"utf-16": "utf-16le",
	"utf-16be": "utf-16be",
	"windows-1252": "windows-1252",
	"windows-1251": "windows-1251",
	ascii: "windows-1252",
	"ansi_x3.4-1968": "windows-1252",
	"iso-8859-1": "windows-1252",
	latin1: "windows-1252",
	"iso-8859-2": "iso-8859-2",
	"iso-8859-15": "iso-8859-15",
	"koi8-r": "koi8-r",
	"koi8-u": "koi8-u",
};

const CANONICAL = {
	"utf-8": "UTF-8",
	"utf-16le": "UTF-16LE",
	"utf-16be": "UTF-16BE",
};

function normalizeEncoding(label) {
	if (!label) return null;
	const key = String(label).trim().toLowerCase();
	return LABEL_MAP[key] ?? null;
}

function getBOMEncoding(input) {
	const u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
	if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf)
		return "utf-8";
	if (u8.length < 2) return null;
	if (u8[0] === 0xff && u8[1] === 0xfe) return "utf-16le";
	if (u8[0] === 0xfe && u8[1] === 0xff) return "utf-16be";
	return null;
}

function labelToName(label) {
	const enc = normalizeEncoding(label);
	if (!enc) return enc ?? null;
	return CANONICAL[enc] ?? enc;
}

/**
 * Decode bytes using BOM detection + fallback encoding.
 * Used by jsdom to decode HTML/CSS/script content.
 */
function legacyHookDecode(input, fallbackEncoding = "utf-8") {
	let u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
	const bomEncoding = getBOMEncoding(u8);
	if (bomEncoding) {
		u8 = u8.subarray(bomEncoding === "utf-8" ? 3 : 2);
	}
	const enc = bomEncoding ?? normalizeEncoding(fallbackEncoding) ?? "utf-8";
	try {
		return new TextDecoder(enc, { fatal: false }).decode(u8);
	} catch {
		return new TextDecoder("utf-8", { fatal: false }).decode(u8);
	}
}

function TextDecoderStream() {
	throw new Error("TextDecoderStream is not supported in this shim");
}

function TextEncoderStream() {
	throw new Error("TextEncoderStream is not supported in this shim");
}

module.exports = {
	TextDecoder,
	TextEncoder,
	TextDecoderStream,
	TextEncoderStream,
	getBOMEncoding,
	labelToName,
	normalizeEncoding,
	legacyHookDecode,
};
