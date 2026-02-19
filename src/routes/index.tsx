import { createFileRoute } from "@tanstack/react-router";
import {
	Bot,
	BrainCircuit,
	ExternalLink,
	Github,
	ImageIcon,
	LayoutGrid,
	Linkedin,
	Music,
	Sparkles,
	Twitter,
	Webhook,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: PortfolioPage });

const apps = [
	{
		Icon: Bot,
		title: "AI Chat",
		description:
			"Multi-provider streaming AI chat. Supports Claude, OpenAI, Gemini, and local Ollama with tool calling.",
		tags: ["AI", "Streaming", "Multi-provider"],
		href: "/demo/ai-chat",
		iconColor: "text-cyan-400",
		iconBg: "bg-cyan-500/10 border-cyan-500/20",
		glow: "hover:border-cyan-500/30 hover:shadow-cyan-500/10",
	},
	{
		Icon: Music,
		title: "Guitar Shop",
		description:
			"Product inventory with AI-powered recommendations. Domain-driven design with TanStack Query.",
		tags: ["AI", "DDD", "TanStack Query"],
		href: "/demo/guitars",
		iconColor: "text-violet-400",
		iconBg: "bg-violet-500/10 border-violet-500/20",
		glow: "hover:border-violet-500/30 hover:shadow-violet-500/10",
	},
	{
		Icon: ImageIcon,
		title: "AI Image Gen",
		description:
			"Generate images from prompts using AI models with real-time previews.",
		tags: ["AI", "Image", "Generative"],
		href: "/demo/ai-image",
		iconColor: "text-blue-400",
		iconBg: "bg-blue-500/10 border-blue-500/20",
		glow: "hover:border-blue-500/30 hover:shadow-blue-500/10",
	},
	{
		Icon: Webhook,
		title: "MCP Server",
		description:
			"Model Context Protocol integration — exposes a todo server that any AI client can connect to.",
		tags: ["MCP", "Protocol", "AI"],
		href: "/demo/mcp-todos",
		iconColor: "text-emerald-400",
		iconBg: "bg-emerald-500/10 border-emerald-500/20",
		glow: "hover:border-emerald-500/30 hover:shadow-emerald-500/10",
	},
	{
		Icon: LayoutGrid,
		title: "Data Table",
		description:
			"TanStack Table with sorting, filtering, pagination, and column management.",
		tags: ["TanStack Table", "UI"],
		href: "/demo/table",
		iconColor: "text-orange-400",
		iconBg: "bg-orange-500/10 border-orange-500/20",
		glow: "hover:border-orange-500/30 hover:shadow-orange-500/10",
	},
	{
		Icon: BrainCircuit,
		title: "Structured AI Output",
		description:
			"Generate type-safe structured data from natural language with AI and Zod schemas.",
		tags: ["AI", "TypeScript", "Zod"],
		href: "/demo/ai-structured",
		iconColor: "text-pink-400",
		iconBg: "bg-pink-500/10 border-pink-500/20",
		glow: "hover:border-pink-500/30 hover:shadow-pink-500/10",
	},
];

const techStack = [
	"TypeScript",
	"React 19",
	"TanStack Start",
	"Cloudflare Workers",
	"Tailwind CSS",
	"Vitest",
	"Biome",
	"Domain-Driven Design",
];

function PortfolioPage() {
	return (
		<main className="min-h-screen text-white">
			{/* Ambient background glow */}
			<div
				className="fixed inset-0 overflow-hidden pointer-events-none"
				aria-hidden="true"
			>
				<div className="absolute top-[12%] left-[8%] w-[520px] h-[520px] bg-cyan-500/[0.055] rounded-full blur-[140px]" />
				<div className="absolute top-[45%] right-[4%] w-[420px] h-[420px] bg-blue-600/[0.055] rounded-full blur-[140px]" />
				<div className="absolute bottom-[15%] left-[38%] w-[480px] h-[480px] bg-violet-500/[0.045] rounded-full blur-[140px]" />
			</div>

			{/* ── Hero ──────────────────────────────────────────────────────── */}
			<section
				id="hero"
				className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20"
			>
				{/* Availability badge */}
				<div className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 rounded-full border border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-400 text-sm font-medium">
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
					</span>
					Available for new opportunities
				</div>

				{/* Name */}
				<h1 className="text-7xl md:text-9xl font-bold tracking-tight leading-none mb-4">
					<span className="text-white">Ricardo</span>
					<br />
					<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
						Gomes
					</span>
				</h1>

				{/* Role */}
				<p className="text-xl md:text-2xl text-gray-400 font-light mt-5 mb-6 tracking-wide">
					Software Engineer
				</p>

				{/* Pitch */}
				<p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">
					Building fast, scalable web apps with TypeScript, React, and modern
					cloud infrastructure. Focused on clean architecture and great
					developer experience.
				</p>

				{/* Tech stack pills */}
				<div className="flex flex-wrap justify-center gap-2 mb-12 max-w-2xl mx-auto">
					{techStack.map((tech) => (
						<span
							key={tech}
							className="px-3 py-1 text-xs rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-400"
						>
							{tech}
						</span>
					))}
				</div>

				{/* CTAs */}
				<div className="flex flex-wrap items-center justify-center gap-4">
					<button
						type="button"
						onClick={() =>
							document
								.getElementById("apps")
								?.scrollIntoView({ behavior: "smooth" })
						}
						className="px-7 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20"
					>
						View Work
					</button>
					<button
						type="button"
						onClick={() =>
							document
								.getElementById("contact")
								?.scrollIntoView({ behavior: "smooth" })
						}
						className="px-7 py-3 border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-white rounded-xl transition-all duration-200"
					>
						Contact Me
					</button>
				</div>

				{/* Scroll indicator */}
				<div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
					<span className="text-xs tracking-widest uppercase">Scroll</span>
					<div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
				</div>
			</section>

			{/* ── Divider ───────────────────────────────────────────────────── */}
			<div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

			{/* ── Apps Section ──────────────────────────────────────────────── */}
			<section id="apps" className="relative py-28 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-500 text-xs tracking-widest uppercase font-medium">
							<Sparkles size={12} />
							This Repo
						</div>
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
							Other Apps
						</h2>
						<p className="text-gray-500 max-w-lg mx-auto">
							Demo applications and integrations built within this project,
							showcasing modern web patterns.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{apps.map(
							({
								Icon,
								title,
								description,
								tags,
								href,
								iconColor,
								iconBg,
								glow,
							}) => (
								<a
									key={title}
									href={href}
									className={`group relative flex flex-col p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:shadow-xl ${glow}`}
								>
									<div
										className={`inline-flex p-2.5 rounded-xl border mb-4 w-fit ${iconBg}`}
									>
										<Icon size={22} className={iconColor} />
									</div>
									<h3 className="text-base font-semibold text-white mb-2">
										{title}
									</h3>
									<p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">
										{description}
									</p>
									<div className="flex flex-wrap gap-1.5">
										{tags.map((tag) => (
											<span
												key={tag}
												className="px-2 py-0.5 text-xs rounded-md bg-white/[0.05] text-gray-400 border border-white/[0.06]"
											>
												{tag}
											</span>
										))}
									</div>
									<ExternalLink
										size={14}
										className="absolute top-5 right-5 text-white/20 group-hover:text-white/50 transition-colors"
									/>
								</a>
							),
						)}
					</div>
				</div>
			</section>

			{/* ── Divider ───────────────────────────────────────────────────── */}
			<div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

			{/* ── Contact Section ───────────────────────────────────────────── */}
			<section id="contact" className="relative py-28 px-6 pb-40">
				<div className="max-w-2xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-500 text-xs tracking-widest uppercase font-medium">
						Connect
					</div>
					<h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
						Get in touch
					</h2>
					<p className="text-gray-500 mb-12 leading-relaxed">
						Open to new roles, interesting projects, and good conversations
						about software.
					</p>

					<div className="flex flex-wrap items-center justify-center gap-3">
						<a
							href="https://github.com/ricardowgomes"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-gray-300 hover:text-white transition-all duration-200"
						>
							<Github size={18} />
							<span className="font-medium">GitHub</span>
						</a>
						<a
							href="https://linkedin.com/in/ricardowgomes"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-gray-300 hover:text-white transition-all duration-200"
						>
							<Linkedin size={18} />
							<span className="font-medium">LinkedIn</span>
						</a>
						<a
							href="https://x.com/ricardowgomes"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-gray-300 hover:text-white transition-all duration-200"
						>
							<Twitter size={18} />
							<span className="font-medium">X</span>
						</a>
					</div>
				</div>
			</section>
		</main>
	);
}
