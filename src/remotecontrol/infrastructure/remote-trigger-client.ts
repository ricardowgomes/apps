/**
 * Client for the claude.ai RemoteTrigger API.
 *
 * The Worker calls this to launch a full Claude Code session in Anthropic's cloud
 * instead of running `claude --print` inside a GitHub Actions runner.
 *
 * Auth: set CLAUDE_AI_API_TOKEN via `wrangler secret put CLAUDE_AI_API_TOKEN`.
 * Get the token from: claude.ai → Settings → API Keys (or use the CLI token from ~/.claude/).
 */

const BASE_URL = "https://claude.ai/api";
const TRIGGER_ID = "trig_01PyVTcGsQxwzR5PCfVWEs86";

/**
 * Update the trigger's prompt with the feature spec, then fire it.
 * Uses update-then-run because the trigger has one stored prompt slot —
 * this bot handles one feature at a time, so there's no race condition.
 */
export async function runRemoteTrigger(
	apiToken: string,
	featureSpec: string,
): Promise<void> {
	// Step 1: update the trigger's initial message with the feature spec
	const updateRes = await fetch(`${BASE_URL}/v1/code/triggers/${TRIGGER_ID}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			job_config: {
				ccr: {
					events: [
						{
							data: {
								message: {
									content: featureSpec,
									role: "user",
								},
								parent_tool_use_id: null,
								session_id: "",
								type: "user",
								uuid: crypto.randomUUID(),
							},
						},
					],
				},
			},
		}),
	});

	if (!updateRes.ok) {
		const err = await updateRes.text();
		throw new Error(`RemoteTrigger update failed ${updateRes.status}: ${err}`);
	}

	// Step 2: fire the trigger
	const runRes = await fetch(`${BASE_URL}/v1/code/triggers/${TRIGGER_ID}/run`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!runRes.ok) {
		const err = await runRes.text();
		throw new Error(`RemoteTrigger run failed ${runRes.status}: ${err}`);
	}
}
