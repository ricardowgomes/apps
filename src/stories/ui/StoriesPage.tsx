import { Link } from "@tanstack/react-router";
import { BookOpen, Plus, Sparkles } from "lucide-react";
import { useStories } from "../application/use-stories";
import { storyGradient } from "../domain/story";

export function StoriesPage() {
	const stories = useStories();

	return (
		<main className="min-h-screen text-white">
			{/* Ambient glows */}
			<div
				className="fixed inset-0 overflow-hidden pointer-events-none"
				aria-hidden="true"
			>
				<div className="absolute top-[5%] left-[10%] w-[300px] h-[300px] bg-violet-600/[0.06] rounded-full blur-[120px]" />
				<div className="absolute top-[40%] right-[5%] w-[250px] h-[250px] bg-amber-500/[0.05] rounded-full blur-[120px]" />
				<div className="absolute bottom-[15%] left-[30%] w-[350px] h-[350px] bg-rose-500/[0.04] rounded-full blur-[130px]" />
			</div>

			<div className="relative max-w-lg mx-auto px-4 pt-24 pb-36">
				{/* Header */}
				<div className="flex items-end justify-between mb-8">
					<div>
						<p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-1">
							Family Stories
						</p>
						<h1 className="text-3xl font-bold text-white">Storybook</h1>
					</div>
					<Link
						to="/stories/new"
						className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all duration-200 shadow-lg shadow-amber-500/25 active:scale-95"
					>
						<Plus size={16} />
						New Story
					</Link>
				</div>

				{/* Empty state */}
				{stories.length === 0 && (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-amber-500/20 border border-white/[0.08] flex items-center justify-center mb-5">
							<BookOpen size={32} className="text-white/40" />
						</div>
						<h2 className="text-lg font-semibold text-white/80 mb-2">
							No stories yet
						</h2>
						<p className="text-sm text-white/40 max-w-[240px] mb-6">
							Create your first AI illustrated story for the family
						</p>
						<Link
							to="/stories/new"
							className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all active:scale-95"
						>
							<Sparkles size={16} />
							Create a Story
						</Link>
					</div>
				)}

				{/* Story grid */}
				{stories.length > 0 && (
					<div className="grid grid-cols-2 gap-3">
						{stories.map((story) => (
							<StoryCard key={story.id} story={story} />
						))}
					</div>
				)}
			</div>
		</main>
	);
}

interface StoryCardProps {
	story: {
		id: string;
		title: string;
		coverImageUrl: string | null;
		createdAt: Date;
		sceneCount: number;
	};
}

function StoryCard({ story }: StoryCardProps) {
	const gradient = storyGradient(story.id);

	return (
		<Link
			to="/stories/$storyId"
			params={{ storyId: story.id }}
			className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.97]"
		>
			{/* Cover art */}
			<div className={`relative aspect-[3/4] bg-gradient-to-br ${gradient}`}>
				{story.coverImageUrl ? (
					<img
						src={story.coverImageUrl}
						alt={story.title}
						className="absolute inset-0 w-full h-full object-cover"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center opacity-20">
						<BookOpen size={48} className="text-white" />
					</div>
				)}
				{/* Shine */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/[0.05]" />
				{/* Scene count badge */}
				<div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-white/70 font-medium">
					{story.sceneCount} scenes
				</div>
			</div>

			{/* Info */}
			<div className="px-3 py-2.5">
				<h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
					{story.title}
				</h3>
				<p className="text-[11px] text-white/30 mt-0.5">
					{story.createdAt.toLocaleDateString("en-CA", {
						month: "short",
						day: "numeric",
					})}
				</p>
			</div>
		</Link>
	);
}
