import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	/** Custom fallback UI. Defaults to a generic error message with a retry button. */
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

/**
 * Catches unhandled React render errors, reports them to the server (which
 * forwards to Telegram), and shows a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		// Best-effort POST to the server — never block the UI on this
		fetch("/api/report-error", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: error.message,
				stack: info.componentStack ?? error.stack ?? "",
				route: window.location.pathname,
			}),
		}).catch(() => undefined);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback;

			return (
				<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
					<p className="text-lg font-semibold text-red-400">
						Something went wrong
					</p>
					<p className="text-sm text-muted-foreground">
						{this.state.error?.message ?? "An unexpected error occurred."}
					</p>
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
						onClick={() => this.setState({ hasError: false })}
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
