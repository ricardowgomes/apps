import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export default function PortfolioHeader() {
	return (
		<header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#05080d]/80 backdrop-blur-md">
			<Link
				to="/"
				className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
			>
				<span className="text-white">ricardo</span>
				<span className="bg-gradient-to-r from-cyan-400 to-blue-400 [background-clip:text] [-webkit-background-clip:text] text-transparent">
					wgomes
				</span>
			</Link>
			<button
				type="button"
				className="flex items-center gap-2 px-4 py-1.5 text-sm text-white/60 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-all bg-white/[0.04]"
			>
				<LogIn size={14} />
				Login
			</button>
		</header>
	);
}
