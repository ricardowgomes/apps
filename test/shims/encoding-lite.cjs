/**
 * CJS shim for @exodus/bytes/encoding-lite.js
 *
 * jsdom 27 depends on html-encoding-sniffer which tries to require() this
 * ESM-only module. This shim provides the two functions that
 * html-encoding-sniffer actually uses, implemented in CJS.
 *
 * getBOMEncoding / labelToName are specified in the WHATWG Encoding standard.
 */

"use strict";

/** @param {Uint8Array} u8 */
function getBOMEncoding(u8) {
	if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf)
		return "utf-8";
	if (u8.length < 2) return null;
	if (u8[0] === 0xff && u8[1] === 0xfe) return "utf-16le";
	if (u8[0] === 0xfe && u8[1] === 0xff) return "utf-16be";
	return null;
}

// Minimal WHATWG label→name mapping (covers HTML in practice)
const LABEL_MAP = {
	"utf-8": "UTF-8",
	utf8: "UTF-8",
	"unicode-1-1-utf-8": "UTF-8",
	"utf-16le": "UTF-16LE",
	"utf-16": "UTF-16LE",
	"utf-16be": "UTF-16BE",
	"windows-1252": "windows-1252",
	ascii: "windows-1252",
	"ansi_x3.4-1968": "windows-1252",
	"iso-8859-1": "windows-1252",
	latin1: "windows-1252",
	"iso-8859-2": "ISO-8859-2",
	"iso-8859-15": "ISO-8859-15",
	"koi8-r": "KOI8-R",
	"koi8-u": "KOI8-U",
};

/** @param {string|null} label */
function labelToName(label) {
	if (!label) return null;
	const key = String(label).trim().toLowerCase();
	return LABEL_MAP[key] ?? null;
}

function normalizeEncoding(label) {
	const name = labelToName(label);
	if (!name) return null;
	return name.toLowerCase();
}

module.exports = {
	getBOMEncoding,
	labelToName,
	normalizeEncoding,
};
