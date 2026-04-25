import { describe, expect, it } from "vitest";
import {
	createMediaItemSchema,
	MEDIA_STATUS_LABELS_BY_TYPE,
	MEDIA_TYPE_LABELS,
	mediaGradient,
	mediaSearchSchema,
} from "./media-item";

describe("createMediaItemSchema", () => {
	it("validates a minimal movie entry", () => {
		const result = createMediaItemSchema.safeParse({
			type: "movie",
			title: "Inception",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("backlog");
			expect(result.data.genres).toEqual([]);
			expect(result.data.directors).toEqual([]);
		}
	});

	it("validates a full music entry", () => {
		const result = createMediaItemSchema.safeParse({
			type: "music",
			title: "OK Computer",
			year: 1997,
			status: "done",
			rating: 5,
			genres: ["Alternative Rock", "Art Rock"],
			artists: ["Radiohead"],
			album: "OK Computer",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a title that is empty", () => {
		const result = createMediaItemSchema.safeParse({
			type: "movie",
			title: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a rating outside 1–5", () => {
		const result = createMediaItemSchema.safeParse({
			type: "movie",
			title: "Test",
			rating: 6,
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid year", () => {
		const result = createMediaItemSchema.safeParse({
			type: "movie",
			title: "Test",
			year: 1800,
		});
		expect(result.success).toBe(false);
	});

	it("rejects an unknown type", () => {
		const result = createMediaItemSchema.safeParse({
			type: "podcast",
			title: "Test",
		});
		expect(result.success).toBe(false);
	});
});

describe("mediaSearchSchema", () => {
	it("accepts empty search params", () => {
		const result = mediaSearchSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("accepts all valid filters", () => {
		const result = mediaSearchSchema.safeParse({
			query: "inception",
			type: "movie",
			status: "done",
			tag: "Christopher Nolan",
			tagField: "directors",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an invalid tagField", () => {
		const result = mediaSearchSchema.safeParse({
			tagField: "tags",
		});
		expect(result.success).toBe(false);
	});
});

describe("MEDIA_STATUS_LABELS_BY_TYPE", () => {
	it("uses watch language for movies", () => {
		expect(MEDIA_STATUS_LABELS_BY_TYPE.movie.backlog).toBe("Want to Watch");
		expect(MEDIA_STATUS_LABELS_BY_TYPE.movie.done).toBe("Watched");
	});

	it("uses listen language for music", () => {
		expect(MEDIA_STATUS_LABELS_BY_TYPE.music.backlog).toBe("Want to Listen");
		expect(MEDIA_STATUS_LABELS_BY_TYPE.music.done).toBe("Listened");
	});
});

describe("MEDIA_TYPE_LABELS", () => {
	it("maps all types", () => {
		expect(MEDIA_TYPE_LABELS.movie).toBe("Movie");
		expect(MEDIA_TYPE_LABELS.tv_show).toBe("TV Show");
		expect(MEDIA_TYPE_LABELS.music).toBe("Music");
	});
});

describe("mediaGradient", () => {
	it("returns a stable gradient for the same id", () => {
		const g1 = mediaGradient("abc-123");
		const g2 = mediaGradient("abc-123");
		expect(g1).toBe(g2);
	});

	it("returns different gradients for different ids", () => {
		const g1 = mediaGradient("id-one");
		const g2 = mediaGradient("id-two");
		expect(g1).not.toBe(g2);
	});
});
