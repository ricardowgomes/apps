import { useForm } from "@tanstack/react-form";
import { ArrowUpDown, Pencil, Plus, Save, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
	useAddCategory,
	useCategories,
	useRemoveCategory,
	useUpdateCategory,
} from "../application/use-categories";
import type { CategoryInput } from "../domain/category";

// ---------------------------------------------------------------------------
// Colour palette for the icon picker
// ---------------------------------------------------------------------------
const PRESET_COLORS = [
	"#10b981",
	"#06b6d4",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#ec4899",
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#6b7280",
];

// ---------------------------------------------------------------------------
// Inline edit / create form
// ---------------------------------------------------------------------------
interface CategoryFormProps {
	initialValues?: Partial<CategoryInput>;
	onSave: (data: CategoryInput) => Promise<void>;
	onCancel: () => void;
}

function CategoryForm({ initialValues, onSave, onCancel }: CategoryFormProps) {
	const form = useForm({
		defaultValues: {
			name: initialValues?.name ?? "",
			icon: initialValues?.icon ?? "",
			color: initialValues?.color ?? "#6366f1",
			keywords: (initialValues?.keywords ?? []).join(", "),
		},
		onSubmit: async ({ value }) => {
			const keywords = value.keywords
				.split(",")
				.map((k) => k.trim().toLowerCase())
				.filter(Boolean);
			await onSave({
				name: value.name,
				icon: value.icon,
				color: value.color,
				keywords,
			});
		},
	});

	return (
		<form
			className="space-y-3"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div className="grid grid-cols-[auto_1fr] gap-3 items-start">
				{/* Icon + colour */}
				<div className="flex flex-col gap-2">
					<form.Field name="icon">
						{(field) => (
							<input
								type="text"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="🏷️"
								maxLength={4}
								className="w-14 h-11 text-center text-xl rounded-lg bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-cyan-500/40"
							/>
						)}
					</form.Field>
					<form.Field name="color">
						{(field) => (
							<input
								type="color"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className="w-14 h-6 cursor-pointer rounded bg-transparent border-0 p-0"
								title="Pick a colour"
							/>
						)}
					</form.Field>
				</div>

				{/* Name + keywords */}
				<div className="flex flex-col gap-2">
					<form.Field name="name">
						{(field) => (
							<input
								type="text"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Category name"
								required
								className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
							/>
						)}
					</form.Field>
					<form.Field name="keywords">
						{(field) => (
							<input
								type="text"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Keywords (comma-separated): walmart, grocery…"
								className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
							/>
						)}
					</form.Field>
				</div>
			</div>

			{/* Colour presets */}
			<div className="flex flex-wrap gap-1.5">
				{PRESET_COLORS.map((c) => (
					<form.Field name="color" key={c}>
						{(field) => (
							<button
								type="button"
								onClick={() => field.handleChange(c)}
								className="w-5 h-5 rounded-full ring-offset-1 ring-offset-[#070d14] transition-all hover:scale-110"
								style={{
									backgroundColor: c,
									outline: field.state.value === c ? `2px solid ${c}` : "none",
								}}
								aria-label={c}
							/>
						)}
					</form.Field>
				))}
			</div>

			{/* Actions */}
			<form.Subscribe selector={(s) => s.isSubmitting}>
				{(isSubmitting) => (
					<div className="flex gap-2 pt-1">
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all disabled:opacity-50"
						>
							<Save size={12} />
							{isSubmitting ? "Saving…" : "Save"}
						</button>
						<button
							type="button"
							onClick={onCancel}
							className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:text-white transition-colors"
						>
							<X size={12} />
							Cancel
						</button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type SortKey = "name" | "createdAt";

export function CategoriesPage() {
	const { data: categories } = useCategories();
	const addCategory = useAddCategory();
	const updateCategory = useUpdateCategory();
	const removeCategory = useRemoveCategory();

	const [sortKey, setSortKey] = useState<SortKey>("name");
	const [sortAsc, setSortAsc] = useState(true);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	function toggleSort(key: SortKey) {
		if (sortKey === key) setSortAsc((a) => !a);
		else {
			setSortKey(key);
			setSortAsc(true);
		}
	}

	const sorted = [...categories].sort((a, b) => {
		const v =
			sortKey === "name"
				? a.name.localeCompare(b.name)
				: a.createdAt.localeCompare(b.createdAt);
		return sortAsc ? v : -v;
	});

	async function handleCreate(data: CategoryInput) {
		await addCategory(data);
		setShowCreateForm(false);
	}

	async function handleUpdate(id: string, data: CategoryInput) {
		await updateCategory({ id, ...data });
		setEditingId(null);
	}

	async function handleDelete(id: string) {
		await removeCategory(id);
		setConfirmDeleteId(null);
	}

	return (
		<div className="min-h-screen bg-[#030712] text-white pb-32">
			{/* Header */}
			<div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
							<Tag size={18} className="text-cyan-400" />
						</div>
						<div>
							<h1 className="text-lg font-semibold">Categories</h1>
							<p className="text-xs text-gray-500 mt-0.5">
								{categories.length} categor
								{categories.length === 1 ? "y" : "ies"}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => {
							setShowCreateForm(true);
							setEditingId(null);
						}}
						className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-all"
					>
						<Plus size={15} />
						New
					</button>
				</div>
			</div>

			<div className="px-4 max-w-2xl mx-auto space-y-3">
				{/* Create form */}
				{showCreateForm && (
					<div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4">
						<p className="text-xs text-cyan-400 font-medium mb-3">
							New category
						</p>
						<CategoryForm
							onSave={handleCreate}
							onCancel={() => setShowCreateForm(false)}
						/>
					</div>
				)}

				{/* Sort controls */}
				<div className="flex items-center gap-2 text-xs text-gray-500">
					<button
						type="button"
						onClick={() => toggleSort("name")}
						className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
							sortKey === "name"
								? "text-cyan-400 bg-cyan-500/10"
								: "hover:text-white"
						}`}
					>
						<ArrowUpDown size={11} />
						Name {sortKey === "name" ? (sortAsc ? "↑" : "↓") : ""}
					</button>
					<button
						type="button"
						onClick={() => toggleSort("createdAt")}
						className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
							sortKey === "createdAt"
								? "text-cyan-400 bg-cyan-500/10"
								: "hover:text-white"
						}`}
					>
						<ArrowUpDown size={11} />
						Created {sortKey === "createdAt" ? (sortAsc ? "↑" : "↓") : ""}
					</button>
				</div>

				{/* Category rows */}
				{sorted.length === 0 && (
					<p className="text-sm text-gray-600 text-center py-10">
						No categories yet. Create one above.
					</p>
				)}

				{sorted.map((cat) => (
					<div
						key={cat.id}
						className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
					>
						{editingId === cat.id ? (
							<>
								<p className="text-xs text-gray-500 font-medium mb-3">
									Editing
								</p>
								<CategoryForm
									initialValues={cat}
									onSave={(data) => handleUpdate(cat.id, data)}
									onCancel={() => setEditingId(null)}
								/>
							</>
						) : (
							<div className="flex items-center justify-between gap-3">
								{/* Category info */}
								<div className="flex items-center gap-3 min-w-0">
									<div
										className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
										style={{ backgroundColor: `${cat.color}20` }}
									>
										{cat.icon || "🏷️"}
									</div>
									<div className="min-w-0">
										<p
											className="text-sm font-medium"
											style={{ color: cat.color }}
										>
											{cat.name}
										</p>
										{cat.keywords.length > 0 && (
											<p className="text-xs text-gray-600 mt-0.5 truncate">
												{cat.keywords.join(", ")}
											</p>
										)}
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-1 flex-shrink-0">
									{confirmDeleteId === cat.id ? (
										<>
											<button
												type="button"
												onClick={() => handleDelete(cat.id)}
												className="px-2 py-1.5 rounded-lg text-xs bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
											>
												Confirm
											</button>
											<button
												type="button"
												onClick={() => setConfirmDeleteId(null)}
												className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white transition-colors"
											>
												Cancel
											</button>
										</>
									) : (
										<>
											<button
												type="button"
												onClick={() => {
													setEditingId(cat.id);
													setShowCreateForm(false);
												}}
												className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
												aria-label={`Edit ${cat.name}`}
											>
												<Pencil size={14} />
											</button>
											<button
												type="button"
												onClick={() => setConfirmDeleteId(cat.id)}
												className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors"
												aria-label={`Delete ${cat.name}`}
											>
												<Trash2 size={14} />
											</button>
										</>
									)}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
