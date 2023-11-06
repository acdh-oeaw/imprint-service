import * as YAML from "yaml";
import { z } from "zod";

import type { RedmineIssue } from "./redmine.js";

const imprintParamsSchema = z.object({
	value: z.string().min(1),
});

const imprintConfigSchema = z.object({
	/** we ignore `language` setting from redmine. */
	copyrightNotice: z
		.object({ de: z.string().min(1).nullish(), en: z.string().min(1).nullish() })
		.optional(),
	hasMatomo: z.boolean().default(true),
	matomoNotice: z
		.object({ de: z.string().min(1).nullish(), en: z.string().min(1).nullish() })
		.optional(),
	projectNature: z
		.object({ de: z.string().min(1).nullish(), en: z.string().min(1).nullish() })
		.optional(),
	responsiblePersons: z
		.object({ de: z.string().min(1).nullish(), en: z.string().min(1).nullish() })
		.optional(),
	websiteAim: z
		.object({ de: z.string().min(1).nullish(), en: z.string().min(1).nullish() })
		.optional(),
});

export type ImprintConfig = z.infer<typeof imprintConfigSchema>;

export function getImprintConfig(issue: RedmineIssue): ImprintConfig {
	const params = imprintParamsSchema.parse(
		issue.custom_fields.find((field) => field.name === "ImprintParams"),
	).value;

	const config = imprintConfigSchema.parse(
		/** Use YAML 1.1 to parse 'yes'/'no' on `hasMatomo` as booleans. */
		YAML.parse(params, { version: "1.1" }),
	);

	return config;
}
