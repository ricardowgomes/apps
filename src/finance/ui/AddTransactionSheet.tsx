import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	useAddTransaction,
	useUpdateTransaction,
} from "../application/use-transactions";
import {
	EXPENSE_CATEGORIES,
	INCOME_CATEGORIES,
	type Transaction,
} from "../domain/transaction";

interface AddTransactionSheetProps {
	open: boolean;
	onClose: () => void;
	/** When provided the sheet opens in edit mode pre-filled with these values. */
	initialValues?: Transaction;
}

const today = () => new Date().toISOString().split("T")[0];

export function AddTransactionSheet({
	open,
	onClose,
	initialValues,
}: AddTransactionSheetProps) {
	const isEditMode = initialValues !== undefined;
	const addTransaction = useAddTransaction();
	const updateTransaction = useUpdateTransaction();

	const [selectedType, setSelectedType] = useState<"income" | "expense">(
		initialValues?.type ?? "expense",
	);

	const form = useForm({
		defaultValues: {
			type: (initialValues?.type ?? "expense") as "income" | "expense",
			amount: (initialValues?.amount ?? "") as unknown as number,
			currency: initialValues?.currency ?? "CAD",
			category: initialValues?.category ?? "",
			description: initialValues?.description ?? "",
			date: initialValues?.date ?? today(),
		},
		onSubmit: async ({ value }) => {
			const parsed = Number(value.amount);
			if (!parsed || parsed <= 0) return;
			if (!value.category || !value.description || !value.date) return;

			if (isEditMode && initialValues) {
				await updateTransaction({
					id: initialValues.id,
					type: value.type,
					amount: parsed,
					currency: value.currency,
					category: value.category,
					description: value.description,
					date: value.date,
				});
			} else {
				await addTransaction({
					type: value.type,
					amount: parsed,
					currency: value.currency,
					category: value.category,
					description: value.description,
					date: value.date,
				});
			}
			onClose();
			form.reset();
			setSelectedType("expense");
		},
	});

	// Reset form when sheet opens/closes or switches between add/edit
	useEffect(() => {
		if (!open) {
			form.reset();
			setSelectedType("expense");
		} else if (initialValues) {
			form.reset({
				type: initialValues.type,
				amount: initialValues.amount,
				currency: initialValues.currency,
				category: initialValues.category,
				description: initialValues.description,
				date: initialValues.date,
			});
			setSelectedType(initialValues.type);
		}
	}, [open, initialValues, form]);

	// Trap escape key
	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	const categories =
		selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

	return (
		<>
			{/* Backdrop — aria-hidden; Escape key closes via useEffect above */}
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
				aria-label={isEditMode ? "Edit transaction" : "Add transaction"}
				className={`fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-white/[0.08] bg-[#070d14] shadow-2xl transition-transform duration-300 ease-out ${
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
						{isEditMode ? "Edit Transaction" : "New Transaction"}
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

				{/* Form */}
				<form
					className="px-6 pb-8 space-y-5"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					{/* Type toggle */}
					<form.Field name="type">
						{(field) => (
							<div className="flex rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
								{(["expense", "income"] as const).map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => {
											field.handleChange(t);
											setSelectedType(t);
											form.setFieldValue("category", "");
										}}
										className={`flex-1 py-2.5 text-sm font-medium transition-all capitalize ${
											field.state.value === t
												? t === "income"
													? "bg-emerald-500/20 text-emerald-400"
													: "bg-rose-500/20 text-rose-400"
												: "text-gray-500 hover:text-white"
										}`}
									>
										{t}
									</button>
								))}
							</div>
						)}
					</form.Field>

					{/* Amount */}
					<form.Field name="amount">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="amount"
									className="text-xs text-gray-500 font-medium"
								>
									Amount (CAD)
								</label>
								<div className="relative">
									<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
										$
									</span>
									<input
										id="amount"
										type="number"
										inputMode="decimal"
										min="0.01"
										step="0.01"
										placeholder="0.00"
										value={field.state.value === 0 ? "" : field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value as unknown as number)
										}
										className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors text-sm"
									/>
								</div>
							</div>
						)}
					</form.Field>

					{/* Category */}
					<form.Field name="category">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="category"
									className="text-xs text-gray-500 font-medium"
								>
									Category
								</label>
								<select
									id="category"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-colors appearance-none"
								>
									<option value="" disabled>
										Select a category…
									</option>
									{categories.map((cat) => (
										<option key={cat} value={cat} className="bg-[#070d14]">
											{cat}
										</option>
									))}
								</select>
							</div>
						)}
					</form.Field>

					{/* Description */}
					<form.Field name="description">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="description"
									className="text-xs text-gray-500 font-medium"
								>
									Description
								</label>
								<input
									id="description"
									type="text"
									placeholder="What was this for?"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors"
								/>
							</div>
						)}
					</form.Field>

					{/* Date */}
					<form.Field name="date">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="date"
									className="text-xs text-gray-500 font-medium"
								>
									Date
								</label>
								<input
									id="date"
									type="date"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-colors [color-scheme:dark]"
								/>
							</div>
						)}
					</form.Field>

					{/* Submit */}
					<form.Subscribe selector={(s) => s.isSubmitting}>
						{(isSubmitting) => (
							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
							>
								{isSubmitting
									? isEditMode
										? "Saving…"
										: "Adding…"
									: isEditMode
										? "Save Changes"
										: "Add Transaction"}
							</button>
						)}
					</form.Subscribe>
				</form>
			</div>
		</>
	);
}
