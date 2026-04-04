import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useEffect } from "react";
import {
	useAddPortfolioEntry,
	useUpdatePortfolioEntry,
} from "../application/use-portfolio";
import type { PortfolioEntry } from "../domain/portfolio-entry";

interface PortfolioEntrySheetProps {
	open: boolean;
	onClose: () => void;
	/** When provided the sheet opens in edit mode pre-filled with these values. */
	initialValues?: PortfolioEntry;
}

export function PortfolioEntrySheet({
	open,
	onClose,
	initialValues,
}: PortfolioEntrySheetProps) {
	const isEditMode = initialValues !== undefined;
	const addEntry = useAddPortfolioEntry();
	const updateEntry = useUpdatePortfolioEntry();

	const form = useForm({
		defaultValues: {
			type: (initialValues?.type ?? "investment") as "investment" | "debt",
			name: initialValues?.name ?? "",
			total_amount: (initialValues?.total_amount ?? "") as unknown as number,
			monthly_amount: (initialValues?.monthly_amount ?? "") as unknown as
				| number
				| null,
			interest_rate: (initialValues?.interest_rate ?? "") as unknown as
				| number
				| null,
			currency: initialValues?.currency ?? "CAD",
		},
		onSubmit: async ({ value }) => {
			const totalParsed = Number(value.total_amount);
			if (Number.isNaN(totalParsed) || totalParsed < 0) return;
			if (!value.name.trim()) return;

			const monthlyStr = String(value.monthly_amount ?? "").trim();
			const rateStr = String(value.interest_rate ?? "").trim();

			const monthly_amount = monthlyStr === "" ? null : Number(monthlyStr);
			const interest_rate = rateStr === "" ? null : Number(rateStr);

			const payload = {
				type: value.type,
				name: value.name.trim(),
				total_amount: totalParsed,
				monthly_amount:
					monthly_amount !== null && !Number.isNaN(monthly_amount)
						? monthly_amount
						: null,
				interest_rate:
					interest_rate !== null && !Number.isNaN(interest_rate)
						? interest_rate
						: null,
				currency: value.currency,
			};

			if (isEditMode && initialValues) {
				await updateEntry({ id: initialValues.id, ...payload });
			} else {
				await addEntry(payload);
			}
			onClose();
			form.reset();
		},
	});

	// Reset form when sheet opens/closes or switches between add/edit
	useEffect(() => {
		if (!open) {
			form.reset();
		} else if (initialValues) {
			form.reset({
				type: initialValues.type,
				name: initialValues.name,
				total_amount: initialValues.total_amount,
				monthly_amount: initialValues.monthly_amount,
				interest_rate: initialValues.interest_rate,
				currency: initialValues.currency,
			});
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
				aria-label={isEditMode ? "Edit entry" : "Add entry"}
				aria-hidden={open ? undefined : true}
				data-testid="portfolio-entry-sheet"
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
						{isEditMode ? "Edit Entry" : "New Entry"}
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
								{(["investment", "debt"] as const).map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => field.handleChange(t)}
										className={`flex-1 py-2.5 text-sm font-medium transition-all capitalize ${
											field.state.value === t
												? t === "investment"
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

					{/* Name */}
					<form.Field name="name">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="entry-name"
									className="text-xs text-gray-500 font-medium"
								>
									Name
								</label>
								<input
									id="entry-name"
									type="text"
									placeholder="e.g. RRSP Manulife, Car Loan"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors"
								/>
							</div>
						)}
					</form.Field>

					{/* Total Amount */}
					<form.Field name="total_amount">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="entry-total"
									className="text-xs text-gray-500 font-medium"
								>
									Current Balance (CAD)
								</label>
								<div className="relative">
									<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
										$
									</span>
									<input
										id="entry-total"
										type="number"
										inputMode="decimal"
										min="0"
										step="0.01"
										placeholder="0.00"
										value={
											field.state.value === 0 ? "" : (field.state.value ?? "")
										}
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

					{/* Monthly Amount */}
					<form.Field name="monthly_amount">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="entry-monthly"
									className="text-xs text-gray-500 font-medium"
								>
									Monthly Contribution / Payment (CAD)
									<span className="ml-1 text-gray-600 normal-case">
										(leave blank if N/A)
									</span>
								</label>
								<div className="relative">
									<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
										$
									</span>
									<input
										id="entry-monthly"
										type="number"
										inputMode="decimal"
										min="0"
										step="0.01"
										placeholder="N/A"
										value={
											field.state.value === null || field.state.value === 0
												? ""
												: (field.state.value ?? "")
										}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(
												e.target.value === ""
													? null
													: (e.target.value as unknown as number),
											)
										}
										className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors text-sm"
									/>
								</div>
							</div>
						)}
					</form.Field>

					{/* Interest Rate */}
					<form.Field name="interest_rate">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="entry-rate"
									className="text-xs text-gray-500 font-medium"
								>
									Interest Rate (%)
									<span className="ml-1 text-gray-600 normal-case">
										(leave blank if N/A)
									</span>
								</label>
								<div className="relative">
									<input
										id="entry-rate"
										type="number"
										inputMode="decimal"
										min="0"
										step="0.01"
										placeholder="N/A"
										value={
											field.state.value === null || field.state.value === 0
												? ""
												: (field.state.value ?? "")
										}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(
												e.target.value === ""
													? null
													: (e.target.value as unknown as number),
											)
										}
										className="w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors text-sm"
									/>
									<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
										%
									</span>
								</div>
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
										: "Add Entry"}
							</button>
						)}
					</form.Subscribe>
				</form>
			</div>
		</>
	);
}
