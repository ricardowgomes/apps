import { Pencil, Star, Trash2 } from "lucide-react";
import {
	MEDIA_STATUS_LABELS_BY_TYPE,
	MEDIA_TYPE_LABELS,
	type MediaItem,
	type MediaSearchParams,
	mediaGradient,
} from "../domain/media-item";

interface MediaCardProps {
	item: MediaItem;
	onEdit: (item: MediaItem) => void;
	onDelete: (id: string) => void;
	onTagClick: (params: Pick<MediaSearchParams, "tag" | "tagField">) => void;
}

const STATUS_COLORS = {
	backlog: "text-gray-400 bg-gray-500/10 border-gray-500/20",
	in_progress: "text-amber-400 bg-amber-500/10 border-amber-500/20",
	done: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const TYPE_COLORS = {
	movie: "text-violet-300 bg-violet-500/10 border-violet-500/20",
	tv_show: "text-blue-300 bg-blue-500/10 border-blue-500/20",
	music: "text-rose-300 bg-rose-500/10 border-rose-500/20",
};

export function MediaCard({
	item,
	onEdit,
	onDelete,
	onTagClick,
}: MediaCardProps) {
	const gradient = mediaGradient(item.id);
	const statusLabel = MEDIA_STATUS_LABELS_BY_TYPE[item.type][item.status];

	return (
		<div
			data-testid="media-card"
			className="group relative flex gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
		>
			{/* Poster */}
			<div className="shrink-0 w-14 h-20 rounded-xl overflow-hidden">
				{item.posterUrl ? (
					<img
						src={item.posterUrl}
						alt={item.title}
						className="w-full h-full object-cover"
					/>
				) : (
					<div
						className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
					>
						<span className="text-white/60 text-lg font-bold">
							{item.title.charAt(0).toUpperCase()}
						</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h3 className="text-sm font-semibold text-white truncate leading-tight">
							{item.title}
						</h3>
						{item.album && item.album !== item.title && (
							<p className="text-xs text-gray-500 truncate mt-0.5">
								{item.album}
							</p>
						)}
						{item.year && (
							<p className="text-xs text-gray-600 mt-0.5">{item.year}</p>
						)}
					</div>

					{/* Action buttons */}
					<div className="flex items-center gap-1 shrink-0">
						<button
							type="button"
							onClick={() => onEdit(item)}
							className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
							aria-label={`Edit ${item.title}`}
						>
							<Pencil size={14} />
						</button>
						<button
							type="button"
							onClick={() => onDelete(item.id)}
							className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
							aria-label={`Delete ${item.title}`}
						>
							<Trash2 size={14} />
						</button>
					</div>
				</div>

				{/* Badges row */}
				<div className="flex flex-wrap items-center gap-1.5 mt-2">
					<span
						className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${TYPE_COLORS[item.type]}`}
					>
						{MEDIA_TYPE_LABELS[item.type]}
					</span>
					<span
						className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[item.status]}`}
					>
						{statusLabel}
					</span>
					{item.rating !== null && (
						<span className="flex items-center gap-0.5 text-[11px] text-amber-400">
							<Star size={10} fill="currentColor" />
							{item.rating}/5
						</span>
					)}
				</div>

				{/* Tags (connections) */}
				<TagList tags={item.genres} field="genres" onTagClick={onTagClick} />
				<TagList tags={item.artists} field="artists" onTagClick={onTagClick} />
				<TagList
					tags={item.directors}
					field="directors"
					onTagClick={onTagClick}
				/>
				<TagList
					tags={item.castMembers}
					field="cast_members"
					onTagClick={onTagClick}
				/>
			</div>
		</div>
	);
}

interface TagListProps {
	tags: string[];
	field: NonNullable<MediaSearchParams["tagField"]>;
	onTagClick: (params: Pick<MediaSearchParams, "tag" | "tagField">) => void;
}

function TagList({ tags, field, onTagClick }: TagListProps) {
	if (tags.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1 mt-1.5">
			{tags.map((tag) => (
				<button
					key={tag}
					type="button"
					onClick={() => onTagClick({ tag, tagField: field })}
					className="px-1.5 py-0.5 rounded text-[10px] text-gray-400 bg-white/[0.04] hover:bg-violet-500/20 hover:text-violet-300 transition-colors border border-transparent hover:border-violet-500/30"
				>
					{tag}
				</button>
			))}
		</div>
	);
}
