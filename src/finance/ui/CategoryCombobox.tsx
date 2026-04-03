import { ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Category } from "../domain/category";

interface CategoryComboboxProps {
	/** All available categories */
	categories: Category[];
	/** Currently selected category name */
	value: string;
	onChange: (value: string) => void;
	/** If true, shows a "Create [query]" option when no match is found */
	allowCreate?: boolean;
	onCreateCategory?: (name: string) => Promise<void>;
	placeholder?: string;
	id?: string;
}

/**
 * Searchable category dropdown.
 * - Type to filter existing categories
 * - If no match and allowCreate=true, shows "Create '[name]'" option
 * - Selecting "Create" calls onCreateCategory then selects the new name
 */
export function CategoryCombobox({
	categories,
	value,
	onChange,
	allowCreate = true,
	onCreateCategory,
	placeholder = "Select or create a category…",
	id,
}: CategoryComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [creating, setCreating] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		function onPointerDown(e: PointerEvent) {
			if (!containerRef.current?.contains(e.target as Node)) {
				setOpen(false);
				setQuery("");
			}
		}
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [open]);

	// Focus input when dropdown opens
	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const filtered =
		query.trim() === ""
			? categories
			: categories.filter((c) =>
					c.name.toLowerCase().includes(query.toLowerCase()),
				);

	const exactMatch = categories.some(
		(c) => c.name.toLowerCase() === query.trim().toLowerCase(),
	);

	const showCreate =
		allowCreate && query.trim().length > 0 && !exactMatch && onCreateCategory;

	const selected = categories.find((c) => c.name === value);

	async function handleCreate() {
		if (!onCreateCategory || !query.trim()) return;
		setCreating(true);
		try {
			await onCreateCategory(query.trim());
			onChange(query.trim());
			setOpen(false);
			setQuery("");
		} finally {
			setCreating(false);
		}
	}

	function handleSelect(name: string) {
		onChange(name);
		setOpen(false);
		setQuery("");
	}

	function handleClear(e: React.MouseEvent) {
		e.stopPropagation();
		onChange("");
		setQuery("");
	}

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger */}
			<button
				id={id}
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-cyan-500/40 transition-colors"
			>
				<span className={selected ? "text-white" : "text-gray-600"}>
					{selected ? (
						<span className="flex items-center gap-2">
							<span>{selected.icon}</span>
							<span>{selected.name}</span>
						</span>
					) : (
						placeholder
					)}
				</span>
				<span className="flex items-center gap-1 text-gray-500">
					{value && (
						<button
							type="button"
							onClick={handleClear}
							className="p-0.5 hover:text-white transition-colors rounded"
							aria-label="Clear"
						>
							<X size={12} />
						</button>
					)}
					<ChevronDown
						size={14}
						className={`transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</span>
			</button>

			{/* Dropdown */}
			{open && (
				<div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-white/[0.08] bg-[#0b1220] shadow-2xl shadow-black/60 overflow-hidden">
					{/* Search input */}
					<div className="p-2 border-b border-white/[0.06]">
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search categories…"
							className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 transition-colors"
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setOpen(false);
									setQuery("");
								}
								if (e.key === "Enter" && showCreate) handleCreate();
							}}
						/>
					</div>

					{/* Options list */}
					<div className="max-h-52 overflow-y-auto py-1">
						{filtered.length === 0 && !showCreate && (
							<p className="px-3 py-2 text-xs text-gray-600">
								No categories found
							</p>
						)}

						{filtered.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => handleSelect(cat.name)}
								className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
									cat.name === value
										? "bg-cyan-500/10 text-cyan-400"
										: "text-white/80 hover:bg-white/[0.05]"
								}`}
							>
								<span className="text-base leading-none">{cat.icon}</span>
								<span>{cat.name}</span>
							</button>
						))}

						{showCreate && (
							<button
								type="button"
								onClick={handleCreate}
								disabled={creating}
								className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
							>
								<Plus size={14} />
								<span>
									{creating ? "Creating…" : `Create "${query.trim()}"`}
								</span>
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
