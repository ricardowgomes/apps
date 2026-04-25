import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	useCreateMediaItem,
	useUpdateMediaItem,
} from "../application/use-media";
import type { MediaItem, MediaStatus, MediaType } from "../domain/media-item";
import {
	MEDIA_STATUS_LABELS_BY_TYPE,
	MEDIA_STATUSES,
	MEDIA_TYPE_LABELS,
	MEDIA_TYPES,
} from "../domain/media-item";
import { TagInput } from "./TagInput";

interface AddMediaSheetProps {
	open: boolean;
	onClose: () => void;
	initialValues?: MediaItem;
}

const DEFAULT_TYPE: MediaType = "movie";

export function AddMediaSheet({
	open,
	onClose,
	initialValues,
}: AddMediaSheetProps) {
	const isEdit = initialValues !== undefined;
	const createItem = useCreateMediaItem();
	const updateItem = useUpdateMediaItem();

	const [selectedType, setSelectedType] = useState<MediaType>(
		initialValues?.type ?? DEFAULT_TYPE,
	);

	const form = useForm({
		defaultValues: buildDefaults(initialValues),
		onSubmit: async ({ value }) => {
			if (isEdit && initialValues) {
				await updateItem.mutateAsync({
					id: initialValues.id,
					...value,
					type: selectedType,
					rating: value.rating ? Number(value.rating) : null,
					year: value.year ? Number(value.year) : null,
				});
			} else {
				await createItem.mutateAsync({
					...value,
					type: selectedType,
					rating: value.rating ? Number(value.rating) : null,
					year: value.year ? Number(value.year) : null,
				});
			}
			onClose();
		},
	});

	// Reset on open/close
	useEffect(() => {
		if (!open) {
			form.reset();
			setSelectedType(DEFAULT_TYPE);
		} else if (initialValues) {
			setSelectedType(initialValues.type);
			form.reset(buildDefaults(initialValues));
		}
	}, [open, initialValues, form]);

	// Escape to close
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);

	const isPending = createItem.isPending || updateItem.isPending;

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
					open ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
				onKeyDown={undefined}
				role="presentation"
				aria-hidden="true"
			/>

			{/* Sheet */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label={isEdit ? "Edit media item" : "Add media item"}
				aria-hidden={open ? undefined : true}
				data-testid="media-sheet"
				className={`fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-white/[0.08] bg-[#070d14] shadow-2xl transition-transform duration-300 ease-out ${
					open ? "translate-y-0" : "translate-y-full"
				}`}
			>
				{/* Drag handle */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full bg-white/20" />
				</div>

				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4">
					<h2 className="text-base font-semibold text-white">
						{isEdit ? "Edit" : "Add to Archive"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				<form
					className="px-6 pb-10 space-y-5"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					{/* Type selector */}
					<div className="flex rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
						{MEDIA_TYPES.map((t) => (
							<button
								key={t}
								type="button"
								onClick={() => setSelectedType(t)}
								className={`flex-1 py-2.5 text-sm font-medium transition-all ${
									selectedType === t
										? t === "movie"
											? "bg-violet-500/20 text-violet-300"
											: t === "tv_show"
												? "bg-blue-500/20 text-blue-300"
												: "bg-rose-500/20 text-rose-300"
										: "text-gray-500 hover:text-gray-300"
								}`}
							>
								{MEDIA_TYPE_LABELS[t]}
							</button>
						))}
					</div>

					{/* Title */}
					<form.Field name="title">
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-xs font-medium text-gray-400 mb-1.5"
								>
									Title *
								</label>
								<input
									id={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={
										selectedType === "music" ? "Album or song title" : "Title"
									}
									className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>
						)}
					</form.Field>

					{/* Music-specific: album + artists */}
					{selectedType === "music" && (
						<>
							<form.Field name="album">
								{(field) => (
									<div>
										<label
											htmlFor={field.name}
											className="block text-xs font-medium text-gray-400 mb-1.5"
										>
											Album
										</label>
										<input
											id={field.name}
											value={field.state.value ?? ""}
											onChange={(e) =>
												field.handleChange(e.target.value || null)
											}
											placeholder="Album name"
											className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="artists">
								{(field) => (
									<TagInput
										label="Artists"
										value={field.state.value}
										onChange={field.handleChange}
										placeholder="Add an artist..."
									/>
								)}
							</form.Field>
						</>
					)}

					{/* Movie/TV-specific: directors + cast */}
					{(selectedType === "movie" || selectedType === "tv_show") && (
						<>
							<form.Field name="directors">
								{(field) => (
									<TagInput
										label="Directors"
										value={field.state.value}
										onChange={field.handleChange}
										placeholder="Add a director..."
									/>
								)}
							</form.Field>

							<form.Field name="castMembers">
								{(field) => (
									<TagInput
										label="Cast"
										value={field.state.value}
										onChange={field.handleChange}
										placeholder="Add a cast member..."
									/>
								)}
							</form.Field>
						</>
					)}

					{/* Genres (all types) */}
					<form.Field name="genres">
						{(field) => (
							<TagInput
								label="Genres"
								value={field.state.value}
								onChange={field.handleChange}
								placeholder="Add a genre..."
							/>
						)}
					</form.Field>

					{/* Year + Status row */}
					<div className="grid grid-cols-2 gap-3">
						<form.Field name="year">
							{(field) => (
								<div>
									<label
										htmlFor={field.name}
										className="block text-xs font-medium text-gray-400 mb-1.5"
									>
										Year
									</label>
									<input
										id={field.name}
										type="number"
										value={field.state.value ?? ""}
										onChange={(e) =>
											field.handleChange(
												e.target.value ? Number(e.target.value) : null,
											)
										}
										placeholder="e.g. 2024"
										min={1888}
										max={2100}
										className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="status">
							{(field) => (
								<div>
									<label
										htmlFor={field.name}
										className="block text-xs font-medium text-gray-400 mb-1.5"
									>
										Status
									</label>
									<select
										id={field.name}
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value as MediaStatus)
										}
										className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-[#0a0f1a] text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
									>
										{MEDIA_STATUSES.map((s) => (
											<option key={s} value={s}>
												{MEDIA_STATUS_LABELS_BY_TYPE[selectedType][s]}
											</option>
										))}
									</select>
								</div>
							)}
						</form.Field>
					</div>

					{/* Rating */}
					<form.Field name="rating">
						{(field) => (
							<fieldset>
								<legend className="block text-xs font-medium text-gray-400 mb-1.5">
									Rating
								</legend>
								<div className="flex items-center gap-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type="button"
											onClick={() =>
												field.handleChange(
													field.state.value === star ? null : star,
												)
											}
											className={`text-2xl transition-transform hover:scale-110 ${
												field.state.value !== null && field.state.value >= star
													? "text-amber-400"
													: "text-gray-700"
											}`}
											aria-label={`${star} star${star > 1 ? "s" : ""}`}
										>
											★
										</button>
									))}
									{field.state.value !== null && (
										<button
											type="button"
											onClick={() => field.handleChange(null)}
											className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-1"
										>
											Clear
										</button>
									)}
								</div>
							</fieldset>
						)}
					</form.Field>

					{/* Notes */}
					<form.Field name="notes">
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-xs font-medium text-gray-400 mb-1.5"
								>
									Notes
								</label>
								<textarea
									id={field.name}
									value={field.state.value ?? ""}
									onChange={(e) => field.handleChange(e.target.value || null)}
									placeholder="Personal notes..."
									rows={3}
									className="w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
								/>
							</div>
						)}
					</form.Field>

					{/* Submit */}
					<button
						type="submit"
						disabled={isPending}
						className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
					>
						{isPending
							? isEdit
								? "Saving…"
								: "Adding…"
							: isEdit
								? "Save Changes"
								: "Add to Archive"}
					</button>
				</form>
			</div>
		</>
	);
}

function buildDefaults(item?: MediaItem) {
	return {
		title: item?.title ?? "",
		description: item?.description ?? null,
		year: item?.year ?? null,
		posterUrl: item?.posterUrl ?? null,
		status: (item?.status ?? "backlog") as MediaStatus,
		rating: item?.rating ?? null,
		notes: item?.notes ?? null,
		genres: item?.genres ?? [],
		directors: item?.directors ?? [],
		castMembers: item?.castMembers ?? [],
		artists: item?.artists ?? [],
		album: item?.album ?? null,
	};
}
