import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Layers, Mail } from "lucide-react";

export default function BottomNav() {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isHome = pathname === "/";

	function handleSectionNav(sectionId: string) {
		if (!isHome) {
			navigate({ to: "/" });
			return;
		}
		document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-2xl border border-white/[0.08] bg-[#05080d]/90 backdrop-blur-xl shadow-2xl shadow-black/50">
			<Link
				to="/"
				className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all ${
					isHome
						? "text-cyan-400 bg-cyan-500/[0.1]"
						: "text-white/40 hover:text-white hover:bg-white/[0.05]"
				}`}
			>
				<Home size={20} />
				<span className="text-[11px] font-medium">Home</span>
			</Link>
			<button
				type="button"
				onClick={() => handleSectionNav("apps")}
				className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all text-white/40 hover:text-white hover:bg-white/[0.05]"
			>
				<Layers size={20} />
				<span className="text-[11px] font-medium">Apps</span>
			</button>
			<button
				type="button"
				onClick={() => handleSectionNav("contact")}
				className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all text-white/40 hover:text-white hover:bg-white/[0.05]"
			>
				<Mail size={20} />
				<span className="text-[11px] font-medium">Contact</span>
			</button>
		</nav>
	);
}
