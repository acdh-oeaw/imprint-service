import * as v from "valibot";

import { env } from "./env";

export class HttpError extends Error {
	readonly response: Response;

	constructor(response: Response) {
		super(`${String(response.status)} ${response.statusText}`);
		this.name = "HttpError";
		this.response = response;
	}
}

const timeout = 10_000;
const maxAttempts = 3;
const retryStatusCodes = new Set([408, 425, 429, 500, 502, 503, 504]);

function getRetryDelay(response: Response): number {
	const seconds = Number(response.headers.get("retry-after"));
	/** Fall back to a short delay when the header is missing, invalid or unreasonably long. */
	return seconds >= 1 && seconds <= 10 ? seconds * 1000 : 250;
}

/** Retries transient upstream errors, like `@acdh-oeaw/lib`'s `request` helper did. */
async function fetchRedmine(pathname: string, init?: RequestInit): Promise<Response> {
	const url = new URL(pathname, env.REDMINE_API_BASE_URL);

	for (let attempt = 1; ; attempt++) {
		const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });

		if (response.ok) {
			return response;
		}

		await response.body?.cancel();

		if (attempt >= maxAttempts || !retryStatusCodes.has(response.status)) {
			throw new HttpError(response);
		}

		await Bun.sleep(getRetryDelay(response));
	}
}

/** Ensure redmine api is available. */
export async function pingRedmine(): Promise<void> {
	const response = await fetchRedmine("/");
	await response.body?.cancel();
}

const redmineIssueSchema = v.object({
	issue: v.object({
		/** Only present when the issue's tracker has custom fields. */
		custom_fields: v.optional(
			v.array(
				v.object({
					name: v.string(),
					value: v.unknown(),
				}),
			),
			[],
		),
	}),
});

export type RedmineIssue = v.InferOutput<typeof redmineIssueSchema>["issue"];

export async function getRedmineIssueById(id: number): Promise<RedmineIssue> {
	const credentials = Buffer.from([env.REDMINE_USER, env.REDMINE_PASSWORD].join(":"), "utf-8");

	const response = await fetchRedmine(`/issues/${String(id)}.json`, {
		headers: {
			Accept: "application/json",
			Authorization: `Basic ${credentials.toString("base64")}`,
		},
	});

	const { issue } = v.parse(redmineIssueSchema, await response.json());

	return issue;
}
