import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

export const MEDIA_TYPES = ["movie", "tv_show", "music"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_STATUSES = ["backlog", "in_progress", "done"] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export interface MediaItem {
	id: string;
	type: MediaType;
	title: string;
	description: string | null;
	year: number | null;
	posterUrl: string | null;
	status: MediaStatus;
	rating: number | null;
	notes: string | null;
	genres: string[];
	directors: string[];
	castMembers: string[];
	artists: string[];
	album: string | null;
	addedBy: string;
	addedAt: Date;
}

// ── Validation ────────────────────────────────────────────────────────────────

export const createMediaItemSchema = z.object({
	type: z.enum(MEDIA_TYPES),
	title: z.string().min(1).max(200),
	description: z.string().max(2000).nullable().optional(),
	year: z.number().int().min(1888).max(2100).nullable().optional(),
	posterUrl: z.string().url().nullable().optional(),
	status: z.enum(MEDIA_STATUSES).default("backlog"),
	rating: z.number().int().min(1).max(5).nullable().optional(),
	notes: z.string().max(5000).nullable().optional(),
	genres: z.array(z.string().min(1).max(50)).default([]),
	directors: z.array(z.string().min(1).max(100)).default([]),
	castMembers: z.array(z.string().min(1).max(100)).default([]),
	artists: z.array(z.string().min(1).max(100)).default([]),
	album: z.string().max(200).nullable().optional(),
});

export type CreateMediaItemInput = z.infer<typeof createMediaItemSchema>;

export const updateMediaItemSchema = createMediaItemSchema.partial().extend({
	id: z.string(),
});

export type UpdateMediaItemInput = z.infer<typeof updateMediaItemSchema>;

export const mediaSearchSchema = z.object({
	query: z.string().optional(),
	type: z.enum(MEDIA_TYPES).optional(),
	status: z.enum(MEDIA_STATUSES).optional(),
	tag: z.string().optional(),
	tagField: z
		.enum(["genres", "directors", "cast_members", "artists"])
		.optional(),
});

export type MediaSearchParams = z.infer<typeof mediaSearchSchema>;

// ── Display helpers ───────────────────────────────────────────────────────────

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
	movie: "Movie",
	tv_show: "TV Show",
	music: "Music",
};

export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = {
	backlog: "Backlog",
	in_progress: "In Progress",
	done: "Done",
};

export const MEDIA_STATUS_LABELS_BY_TYPE: Record<
	MediaType,
	Record<MediaStatus, string>
> = {
	movie: { backlog: "Want to Watch", in_progress: "Watching", done: "Watched" },
	tv_show: {
		backlog: "Want to Watch",
		in_progress: "Watching",
		done: "Watched",
	},
	music: {
		backlog: "Want to Listen",
		in_progress: "Listening",
		done: "Listened",
	},
};

// ── Gradient palettes for poster placeholders ─────────────────────────────────

const MEDIA_GRADIENTS = [
	"from-violet-600 via-purple-600 to-indigo-700",
	"from-rose-500 via-pink-500 to-fuchsia-600",
	"from-amber-500 via-orange-500 to-red-500",
	"from-emerald-500 via-teal-500 to-cyan-600",
	"from-sky-500 via-blue-500 to-indigo-600",
	"from-fuchsia-500 via-pink-500 to-rose-600",
	"from-lime-500 via-emerald-500 to-teal-600",
	"from-orange-500 via-amber-400 to-yellow-500",
] as const;

export function mediaGradient(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}
	return MEDIA_GRADIENTS[Math.abs(hash) % MEDIA_GRADIENTS.length];
}
