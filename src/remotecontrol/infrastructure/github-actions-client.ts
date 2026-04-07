const REPO = "ricardowgomes/apps";
const IMPLEMENT_WORKFLOW = "implement-feature.yml";

/** Trigger the implement-feature workflow via GitHub API workflow_dispatch */
export async function triggerImplementation(
	token: string,
	conversationId: string,
	featureSpec: string,
	branchSlug: string,
): Promise<void> {
	const res = await fetch(
		`https://api.github.com/repos/${REPO}/actions/workflows/${IMPLEMENT_WORKFLOW}/dispatches`,
		{
			method: "POST",
			headers: {
				Authorization: `token ${token}`,
				"Content-Type": "application/json",
				Accept: "application/vnd.github+json",
			},
			body: JSON.stringify({
				ref: "main",
				inputs: {
					conversation_id: conversationId,
					feature_spec: featureSpec,
					branch_slug: branchSlug,
				},
			}),
		},
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`GitHub API error ${res.status}: ${err}`);
	}
}

/** Merge a pull request by number */
export async function mergePr(token: string, prNumber: number): Promise<void> {
	const res = await fetch(
		`https://api.github.com/repos/${REPO}/pulls/${prNumber}/merge`,
		{
			method: "PUT",
			headers: {
				Authorization: `token ${token}`,
				"Content-Type": "application/json",
				Accept: "application/vnd.github+json",
			},
			body: JSON.stringify({ merge_method: "squash" }),
		},
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`GitHub merge error ${res.status}: ${err}`);
	}
}

/** Close (don't merge) a pull request */
export async function closePr(token: string, prNumber: number): Promise<void> {
	const res = await fetch(
		`https://api.github.com/repos/${REPO}/pulls/${prNumber}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `token ${token}`,
				"Content-Type": "application/json",
				Accept: "application/vnd.github+json",
			},
			body: JSON.stringify({ state: "closed" }),
		},
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`GitHub close PR error ${res.status}: ${err}`);
	}
}

/** Verify a request came from GitHub Actions using a shared secret in the header */
export function verifyGitHubNotifySecret(
	authHeader: string | null,
	secret: string,
): boolean {
	if (!authHeader) return false;
	return authHeader === `Bearer ${secret}`;
}
