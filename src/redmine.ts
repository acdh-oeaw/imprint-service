import { createUrl, request } from "@acdh-oeaw/lib";
import { z } from "zod";

import { env } from "./env.js";

const redmineIssueSchema = z.object({
	issue: z.object({
		custom_fields: z.array(
			z.object({
				name: z.string(),
				value: z.unknown(),
			}),
		),
	}),
});

export type RedmineIssue = z.infer<typeof redmineIssueSchema>["issue"];

export async function getRedmineIssueById(id: number): Promise<RedmineIssue> {
	const url = createUrl({
		pathname: `/issues/${id}.json`,
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

	const { issue } = redmineIssueSchema.parse(response);

	return issue;
}
