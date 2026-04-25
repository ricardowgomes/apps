import { Search, SlidersHorizontal, X } from "lucide-react";
import { Suspense, useState } from "react";
import { useDeleteMediaItem, useMediaItems } from "../application/use-media";
import type {
	MediaItem,
	MediaSearchParams,
	MediaStatus,
	MediaType,
} from "../domain/media-item";
import {
	MEDIA_STATUS_LABELS,
	MEDIA_STATUSES,
	MEDIA_TYPE_LABELS,
	MEDIA_TYPES,
} from "../domain/media-item";
import { AddMediaSheet } from "./AddMediaSheet";
import { MediaCard } from "./MediaCard";

// ── Archive list (suspense boundary) ─────────────────────────────────────────

interface ArchiveListProps {
	params: MediaSearchParams;
	onEdit: (item: MediaItem) => void;
	onTagClick: (params: Pick<MediaSearchParams, "tag" | "tagField">) => void;
}

function ArchiveList({ params, onEdit, onTagClick }: ArchiveListProps) {
	const items = useMediaItems(params);
	const deleteItem = useDeleteMediaItem();

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
					<span className="text-2xl">🎬</span>
				</div>
				<p className="text-gray-400 text-sm font-medium">Nothing here yet</p>
				<p className="text-gray-600 text-xs mt-1">
					Add a movie, show, or album to get started
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{items.map((item) => (
				<MediaCard
					key={item.id}
					item={item}
					onEdit={onEdit}
					onDelete={(id) => deleteItem.mutate(id)}
					onTagClick={onTagClick}
				/>
			))}
		</div>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MediaPage() {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editItem, setEditItem] = useState<MediaItem | undefined>();
	const [filtersOpen, setFiltersOpen] = useState(false);

	const [query, setQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<MediaType | undefined>();
	const [statusFilter, setStatusFilter] = useState<MediaStatus | undefined>();
	const [activeTag, setActiveTag] = useState<
		Pick<MediaSearchParams, "tag" | "tagField"> | undefined
	>();

	const searchParams: MediaSearchParams = {
		query: query || undefined,
		type: typeFilter,
		status: statusFilter,
		tag: activeTag?.tag,
		tagField: activeTag?.tagField,
	};

	function handleEdit(item: MediaItem) {
		setEditItem(item);
		setSheetOpen(true);
	}

	function handleAdd() {
		setEditItem(undefined);
		setSheetOpen(true);
	}

	function handleClose() {
		setSheetOpen(false);
		setEditItem(undefined);
	}

	function handleTagClick(params: Pick<MediaSearchParams, "tag" | "tagField">) {
		// Toggle: clicking the same tag again clears it
		if (
			activeTag?.tag === params.tag &&
			activeTag?.tagField === params.tagField
		) {
			setActiveTag(undefined);
		} else {
			setActiveTag(params);
		}
	}

	function clearFilters() {
		setQuery("");
		setTypeFilter(undefined);
		setStatusFilter(undefined);
		setActiveTag(undefined);
	}

	const hasActiveFilters = query || typeFilter || statusFilter || activeTag;

	return (
		<>
			<main className="min-h-screen text-white">
				{/* Ambient glow */}
				<div
					className="fixed inset-0 overflow-hidden pointer-events-none"
					aria-hidden="true"
				>
					<div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-violet-500/[0.04] rounded-full blur-[130px]" />
					<div className="absolute top-[50%] right-[5%] w-[350px] h-[350px] bg-indigo-600/[0.04] rounded-full blur-[130px]" />
					<div className="absolute bottom-[10%] left-[40%] w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[130px]" />
				</div>

				<div className="relative max-w-2xl mx-auto px-4 pt-24 pb-32 space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-white">Archive</h1>
							<p className="text-sm text-gray-500 mt-0.5">
								Movies, shows & music
							</p>
						</div>
						<button
							type="button"
							onClick={handleAdd}
							data-testid="add-media-button"
							className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
						>
							+ Add
						</button>
					</div>

					{/* Search + filter bar */}
					<div className="space-y-3">
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Search
									size={15}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
								/>
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search by title…"
									data-testid="media-search"
									className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>
							<button
								type="button"
								onClick={() => setFiltersOpen((v) => !v)}
								className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
									filtersOpen || typeFilter || statusFilter
										? "border-violet-500/50 text-violet-300 bg-violet-500/10"
										: "border-white/[0.08] text-gray-400 hover:text-white bg-white/[0.03]"
								}`}
								aria-label="Toggle filters"
							>
								<SlidersHorizontal size={15} />
								Filters
							</button>
						</div>

						{/* Expandable filter panel */}
						{filtersOpen && (
							<div className="space-y-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
								{/* Type filter */}
								<div>
									<p className="text-xs font-medium text-gray-500 mb-2">Type</p>
									<div className="flex flex-wrap gap-2">
										{MEDIA_TYPES.map((t) => (
											<button
												key={t}
												type="button"
												onClick={() =>
													setTypeFilter(typeFilter === t ? undefined : t)
												}
												className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
													typeFilter === t
														? "bg-violet-500/20 text-violet-300 border-violet-500/40"
														: "text-gray-400 border-white/[0.08] hover:text-white"
												}`}
											>
												{MEDIA_TYPE_LABELS[t]}
											</button>
										))}
									</div>
								</div>

								{/* Status filter */}
								<div>
									<p className="text-xs font-medium text-gray-500 mb-2">
										Status
									</p>
									<div className="flex flex-wrap gap-2">
										{MEDIA_STATUSES.map((s) => (
											<button
												key={s}
												type="button"
												onClick={() =>
													setStatusFilter(statusFilter === s ? undefined : s)
												}
												className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
													statusFilter === s
														? "bg-violet-500/20 text-violet-300 border-violet-500/40"
														: "text-gray-400 border-white/[0.08] hover:text-white"
												}`}
											>
												{MEDIA_STATUS_LABELS[s]}
											</button>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Active tag / connection filter */}
						{activeTag && (
							<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
								<span className="text-xs text-gray-400">Connected by:</span>
								<span className="text-xs font-medium text-violet-300">
									{activeTag.tag}
								</span>
								<button
									type="button"
									onClick={() => setActiveTag(undefined)}
									className="ml-auto text-gray-500 hover:text-white transition-colors"
									aria-label="Clear connection filter"
								>
									<X size={13} />
								</button>
							</div>
						)}

						{/* Clear all filters */}
						{hasActiveFilters && (
							<button
								type="button"
								onClick={clearFilters}
								className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
							>
								Clear all filters
							</button>
						)}
					</div>

					{/* Archive list */}
					<Suspense
						fallback={
							<div className="space-y-3">
								{Array.from({ length: 4 }).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
										key={i}
										className="h-24 rounded-2xl bg-white/[0.02] animate-pulse"
									/>
								))}
							</div>
						}
					>
						<ArchiveList
							params={searchParams}
							onEdit={handleEdit}
							onTagClick={handleTagClick}
						/>
					</Suspense>
				</div>
			</main>

			<AddMediaSheet
				open={sheetOpen}
				onClose={handleClose}
				initialValues={editItem}
			/>
		</>
	);
}
