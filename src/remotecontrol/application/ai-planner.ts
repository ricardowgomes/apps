/**
 * Multi-provider AI planner with automatic fallback.
 * Priority: Anthropic → Gemini → Grok → OpenAI
 */

const PLAN_SYSTEM_PROMPT = `You are a software planning assistant for the exponencial app (TanStack Start + Cloudflare Workers + TypeScript).

Given a feature request, produce a concise implementation plan in this exact format:

**Feature: {title}**

Steps:
1. {step}
2. {step}
...

Effort: S | M | L
Branch: feat/{slug}

Rules:
- Maximum 8 steps. Be specific and actionable.
- Effort: S = < 2 hours, M = half day, L = full day+
- Branch slug: lowercase, hyphens, no spaces
- Do not include test steps — tests are always written
- Do not include deployment steps — CI handles that`;

interface Provider {
	name: string;
	call: (request: string, apiKey: string) => Promise<string>;
	keyEnv: keyof ProviderKeys;
}

interface ProviderKeys {
	ANTHROPIC_API_KEY?: string;
	GEMINI_API_KEY?: string;
	GROK_API_KEY?: string;
	OPENAI_API_KEY?: string;
}

async function callAnthropic(request: string, apiKey: string): Promise<string> {
	const res = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model: "claude-3-5-haiku-20241022",
			max_tokens: 1024,
			system: PLAN_SYSTEM_PROMPT,
			messages: [{ role: "user", content: request }],
		}),
	});
	if (!res.ok) throw new Error(`Anthropic ${res.status}`);
	const data = await res.json<{ content: Array<{ text: string }> }>();
	return data.content[0].text;
}

async function callGemini(request: string, apiKey: string): Promise<string> {
	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				system_instruction: { parts: [{ text: PLAN_SYSTEM_PROMPT }] },
				contents: [{ role: "user", parts: [{ text: request }] }],
			}),
		},
	);
	if (!res.ok) throw new Error(`Gemini ${res.status}`);
	const data = await res.json<{
		candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
	}>();
	return data.candidates[0].content.parts[0].text;
}

async function callOpenAICompat(
	request: string,
	apiKey: string,
	baseUrl: string,
	model: string,
): Promise<string> {
	const res = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model,
			messages: [
				{ role: "system", content: PLAN_SYSTEM_PROMPT },
				{ role: "user", content: request },
			],
			max_tokens: 1024,
		}),
	});
	if (!res.ok) throw new Error(`${baseUrl} ${res.status}`);
	const data = await res.json<{
		choices: Array<{ message: { content: string } }>;
	}>();
	return data.choices[0].message.content;
}

const PROVIDERS: Provider[] = [
	{
		name: "anthropic",
		keyEnv: "ANTHROPIC_API_KEY",
		call: callAnthropic,
	},
	{
		name: "gemini",
		keyEnv: "GEMINI_API_KEY",
		call: (req, key) => callGemini(req, key),
	},
	{
		name: "grok",
		keyEnv: "GROK_API_KEY",
		call: (req, key) =>
			callOpenAICompat(req, key, "https://api.x.ai/v1", "grok-3-mini"),
	},
	{
		name: "openai",
		keyEnv: "OPENAI_API_KEY",
		call: (req, key) =>
			callOpenAICompat(req, key, "https://api.openai.com/v1", "gpt-4o-mini"),
	},
];

/**
 * Generate a feature plan, trying providers in priority order.
 * Throws only if all providers fail or no keys are configured.
 */
export async function generatePlan(
	featureRequest: string,
	keys: ProviderKeys,
): Promise<string> {
	const errors: string[] = [];

	for (const provider of PROVIDERS) {
		const key = keys[provider.keyEnv];
		if (!key) continue;

		try {
			return await provider.call(featureRequest, key);
		} catch (err) {
			errors.push(`${provider.name}: ${err}`);
		}
	}

	throw new Error(
		`All AI providers failed or no API keys configured. Errors: ${errors.join("; ")}`,
	);
}

/**
 * Generate a revised plan incorporating user feedback.
 */
export async function revisePlan(
	featureRequest: string,
	currentPlan: string,
	feedback: string,
	keys: ProviderKeys,
): Promise<string> {
	const prompt = `Original request: ${featureRequest}

Current plan:
${currentPlan}

User feedback: ${feedback}

Please revise the plan based on the feedback. Keep the same format.`;

	return generatePlan(prompt, keys);
}

/** Extract a branch slug from a plan string */
export function extractBranchSlug(plan: string): string {
	const match = plan.match(/Branch:\s*(feat\/[\w-]+)/i);
	return match?.[1] ?? "feat/remote-feature";
}
