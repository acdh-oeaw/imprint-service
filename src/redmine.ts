import { createUrl, request } from "@acdh-oeaw/lib";
import * as v from "valibot";

import { env } from "./env.js";

const redmineIssueSchema = v.object({
	issue: v.object({
		custom_fields: v.array(
			v.object({
				name: v.string(),
				value: v.unknown(),
			}),
		),
	}),
});

export type RedmineIssue = v.InferOutput<typeof redmineIssueSchema>["issue"];

export async function getRedmineIssueById(id: number): Promise<RedmineIssue> {
	const url = createUrl({
		pathname: `/issues/${String(id)}.json`,
		baseUrl: env.REDMINE_API_BASE_URL,
	});

	const response = await request(url, {
		headers: {
			Authorization:
				"Basic " +
				Buffer.from([env.REDMINE_USER, env.REDMINE_PASSWORD].join(":"), "utf-8").toString("base64"),
		},
		responseType: "json",
	});

	const { issue } = v.parse(redmineIssueSchema, response);

	return issue;
}
