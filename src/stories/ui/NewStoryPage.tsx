import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { useGenerateStory } from "../application/use-stories";

const EXAMPLE_PROMPTS = [
	"A little girl who discovers a hidden door in her bedroom that leads to a magical library",
	"A tiny dragon who is afraid of fire and goes on a quest to find courage",
	"Two best friends, a bear and a rabbit, who get lost in the forest and must find their way home",
	"A young inventor who builds a rocket ship from cardboard boxes and flies to the moon",
];

export function NewStoryPage() {
	const [prompt, setPrompt] = useState("");
	const generate = useGenerateStory();

	const canSubmit = prompt.trim().length > 0 && !generate.isPending;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		generate.mutate(prompt.trim());
	}

	function applyExample(p: string) {
		setPrompt(p);
	}

	return (
		<div className="min-h-screen text-white flex flex-col">
			{/* Ambient glows */}
			<div
				className="fixed inset-0 overflow-hidden pointer-events-none"
				aria-hidden="true"
			>
				<div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-violet-600/[0.07] rounded-full blur-[120px]" />
				<div className="absolute bottom-[20%] right-[5%] w-[280px] h-[280px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
			</div>

			{/* Top bar */}
			<div className="relative z-10 flex items-center px-4 pt-12 pb-4">
				<Link
					to="/stories/"
					className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] transition-all active:scale-95"
				>
					<ArrowLeft size={18} />
				</Link>
				<h1 className="text-lg font-semibold text-white ml-3">New Story</h1>
			</div>

			<div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pb-8">
				{/* Hero */}
				<div className="flex flex-col items-center text-center pt-4 pb-8">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center mb-4">
						<Wand2 size={28} className="text-amber-400" />
					</div>
					<h2 className="text-xl font-bold text-white mb-2">
						What's your story about?
					</h2>
					<p className="text-sm text-white/40 max-w-[280px]">
						Describe a story idea and our AI will write and illustrate it for
						you
					</p>
				</div>

				{/* Generation loading state */}
				{generate.isPending && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="relative mb-6">
							<div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-violet-500/20 border border-amber-400/20 flex items-center justify-center">
								<Sparkles size={32} className="text-amber-400 animate-pulse" />
							</div>
							{/* Spinning ring */}
							<div className="absolute inset-0 rounded-3xl border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
						</div>
						<h3 className="text-lg font-semibold text-white mb-2">
							Writing your story…
						</h3>
						<p className="text-sm text-white/40 max-w-[240px]">
							Our storyteller is crafting scenes and illustrations. This takes
							about 10 seconds.
						</p>
					</div>
				)}

				{/* Error */}
				{generate.isError && (
					<div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
						Something went wrong. Please try again.
					</div>
				)}

				{/* Form */}
				{!generate.isPending && (
					<>
						<form onSubmit={handleSubmit} className="flex flex-col gap-3">
							<div className="relative">
								<textarea
									data-testid="story-prompt"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									placeholder="A brave little fox who goes on an adventure to find the golden acorn…"
									rows={4}
									maxLength={500}
									className="w-full px-4 py-4 rounded-2xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/25 text-sm leading-relaxed resize-none focus:outline-none focus:border-amber-400/50 focus:bg-white/[0.07] transition-all"
								/>
								<span className="absolute bottom-3 right-3 text-[11px] text-white/20">
									{prompt.length}/500
								</span>
							</div>

							<button
								type="submit"
								disabled={!canSubmit}
								className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
							>
								<Sparkles size={18} />
								Generate Story
							</button>
						</form>

						{/* Example prompts */}
						<div className="mt-8">
							<p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-3">
								Need inspiration?
							</p>
							<div className="flex flex-col gap-2">
								{EXAMPLE_PROMPTS.map((p) => (
									<button
										type="button"
										key={p}
										data-testid="example-prompt"
										onClick={() => applyExample(p)}
										className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] text-left transition-all active:scale-[0.98]"
									>
										<BookOpen
											size={15}
											className="text-amber-400/70 mt-0.5 shrink-0"
										/>
										<span className="text-sm text-white/60 leading-snug">
											{p}
										</span>
									</button>
								))}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
