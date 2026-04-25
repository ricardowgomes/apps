import { X } from "lucide-react";
import { useId, useRef, useState } from "react";

interface TagInputProps {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
	label: string;
}

export function TagInput({
	value,
	onChange,
	placeholder,
	label,
}: TagInputProps) {
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const inputId = useId();

	function addTag(raw: string) {
		const tag = raw.trim();
		if (tag && !value.includes(tag)) {
			onChange([...value, tag]);
		}
		setInputValue("");
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag(inputValue);
		} else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	}

	function removeTag(tag: string) {
		onChange(value.filter((t) => t !== tag));
	}

	return (
		<div>
			<label
				htmlFor={inputId}
				className="block text-xs font-medium text-gray-400 mb-1.5"
			>
				{label}
			</label>
			<div className="min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03]">
				{value.map((tag) => (
					<span
						key={tag}
						className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30"
					>
						{tag}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								removeTag(tag);
							}}
							className="text-violet-400 hover:text-white transition-colors"
							aria-label={`Remove ${tag}`}
						>
							<X size={10} />
						</button>
					</span>
				))}
				<input
					ref={inputRef}
					id={inputId}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={() => {
						if (inputValue.trim()) addTag(inputValue);
					}}
					placeholder={value.length === 0 ? placeholder : ""}
					className="flex-1 min-w-[80px] bg-transparent text-sm text-white placeholder-gray-600 outline-none"
				/>
			</div>
			<p className="mt-1 text-[11px] text-gray-600">
				Press Enter or comma to add
			</p>
		</div>
	);
}
