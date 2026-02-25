import { Link } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import type { SessionUser } from "@/auth/domain/session";

interface Props {
	user: SessionUser | null;
}

export default function PortfolioHeader({ user }: Props) {
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

			{user ? (
				<div className="flex items-center gap-3">
					{user.avatar && (
						<img
							src={user.avatar}
							alt={user.name ?? user.email}
							className="w-7 h-7 rounded-full ring-1 ring-white/10"
							referrerPolicy="no-referrer"
						/>
					)}
					<span className="text-sm text-white/50 hidden sm:block">
						{user.name ?? user.email}
					</span>
					<form method="POST" action="/api/auth/logout">
						<button
							type="submit"
							className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-all bg-white/[0.04]"
						>
							<LogOut size={14} />
							<span className="hidden sm:inline">Sign out</span>
						</button>
					</form>
				</div>
			) : (
				<Link
					to="/login"
					className="flex items-center gap-2 px-4 py-1.5 text-sm text-white/60 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-all bg-white/[0.04]"
				>
					<LogIn size={14} />
					Login
				</Link>
			)}
		</header>
	);
}
