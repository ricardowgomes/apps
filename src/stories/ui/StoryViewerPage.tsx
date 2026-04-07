import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useDeleteStory, useStory } from "../application/use-stories";
import { storyGradient } from "../domain/story";

interface Props {
	storyId: string;
}

export function StoryViewerPage({ storyId }: Props) {
	const story = useStory(storyId);
	const deleteStory = useDeleteStory();
	const [currentScene, setCurrentScene] = useState(0);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	if (!story) {
		return (
			<div className="min-h-screen flex items-center justify-center text-white/50">
				Story not found.{" "}
				<Link to="/stories/" className="underline ml-1">
					Back to library
				</Link>
			</div>
		);
	}

	const scene = story.scenes[currentScene];
	const isFirst = currentScene === 0;
	const isLast = currentScene === story.scenes.length - 1;
	const gradient = storyGradient(story.id);
	const progress = (currentScene + 1) / story.scenes.length;

	function prev() {
		if (!isFirst) setCurrentScene((n) => n - 1);
	}

	function next() {
		if (!isLast) setCurrentScene((n) => n + 1);
	}

	function handleDelete() {
		deleteStory.mutate(storyId);
	}

	return (
		<div className="fixed inset-0 bg-[#05080d] flex flex-col text-white overflow-hidden">
			{/* Background gradient — changes with scene */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.12] pointer-events-none transition-opacity duration-700`}
				aria-hidden="true"
			/>

			{/* Top bar */}
			<div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
				<Link
					to="/stories/"
					className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] transition-all active:scale-95"
				>
					<ArrowLeft size={18} />
				</Link>

				<div className="flex-1 mx-3">
					<p className="text-xs text-white/40 text-center truncate">
						{story.title}
					</p>
				</div>

				<button
					type="button"
					aria-label="Delete story"
					data-testid="delete-story-btn"
					onClick={() => setShowDeleteConfirm(true)}
					className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-rose-500/10 hover:border-rose-500/30 text-white/30 hover:text-rose-400 transition-all active:scale-95"
				>
					<Trash2 size={16} />
				</button>
			</div>

			{/* Progress bar */}
			<div className="relative z-10 px-4 pb-3">
				<div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
					<div
						className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
						style={{ width: `${progress * 100}%` }}
					/>
				</div>
				<div className="flex items-center justify-center mt-2">
					<span className="text-[11px] text-white/30">
						Scene {currentScene + 1} of {story.scenes.length}
					</span>
				</div>
			</div>

			{/* Scene content — main scrollable area */}
			<div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-4 overflow-y-auto">
				{/* Illustration placeholder */}
				<div
					className={`relative w-full max-w-sm aspect-square rounded-3xl bg-gradient-to-br ${gradient} mb-8 flex items-center justify-center overflow-hidden shadow-2xl`}
				>
					{scene.imageUrl ? (
						<img
							src={scene.imageUrl}
							alt={`Scene ${currentScene + 1}`}
							className="absolute inset-0 w-full h-full object-cover"
						/>
					) : (
						<>
							<div className="absolute inset-0 opacity-30">
								<div className="absolute top-1/4 left-1/4 w-16 h-16 bg-white/20 rounded-full blur-xl" />
								<div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
							</div>
							<BookOpen size={48} className="text-white/30 relative z-10" />
						</>
					)}
					{/* Bottom gradient overlay */}
					<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#05080d]/60 to-transparent" />
				</div>

				{/* Scene text */}
				<p className="text-[17px] leading-relaxed text-white/90 text-center max-w-sm font-light">
					{scene.text}
				</p>
			</div>

			{/* Navigation */}
			<div className="relative z-10 flex items-center justify-between px-6 py-6 pb-safe">
				<button
					type="button"
					data-testid="nav-prev"
					onClick={prev}
					disabled={isFirst}
					className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
				>
					<ChevronLeft size={20} />
					<span className="text-sm font-medium">Prev</span>
				</button>

				{/* Scene dots */}
				<div className="flex items-center gap-1.5">
					{story.scenes.map((sc, i) => (
						<button
							type="button"
							key={sc.id}
							onClick={() => setCurrentScene(i)}
							className={`rounded-full transition-all duration-300 ${
								i === currentScene
									? "w-5 h-2 bg-amber-400"
									: "w-2 h-2 bg-white/20 hover:bg-white/40"
							}`}
						/>
					))}
				</div>

				{isLast ? (
					<Link
						to="/stories/"
						data-testid="nav-done"
						className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all active:scale-95"
					>
						Done
					</Link>
				) : (
					<button
						type="button"
						data-testid="nav-next"
						onClick={next}
						className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all active:scale-95"
					>
						<span>Next</span>
						<ChevronRight size={20} />
					</button>
				)}
			</div>

			{/* Delete confirm overlay */}
			{showDeleteConfirm && (
				<div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
					<div className="w-full max-w-sm bg-[#0f1318] border border-white/[0.10] rounded-3xl p-6 shadow-2xl">
						<h3 className="text-lg font-semibold text-white mb-2">
							Delete this story?
						</h3>
						<p className="text-sm text-white/50 mb-6">
							"{story.title}" will be permanently removed. This can't be undone.
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="flex-1 py-3 rounded-xl border border-white/[0.10] text-white/60 hover:text-white text-sm font-medium transition-all active:scale-95"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={deleteStory.isPending}
								className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-95"
							>
								{deleteStory.isPending ? "Deleting…" : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
