import * as v from "valibot";
import * as YAML from "yaml";

import type { RedmineIssue } from "./redmine";

const imprintParamsSchema = v.object({
	value: v.pipe(v.string(), v.nonEmpty()),
});

const imprintConfigSchema = v.object({
	/** we ignore `language` setting from redmine. */
	copyrightNotice: v.optional(
		v.object({
			de: v.nullish(v.pipe(v.string(), v.nonEmpty())),
			en: v.nullish(v.pipe(v.string(), v.nonEmpty())),
		}),
	),
	hasMatomo: v.optional(v.boolean(), true),
	matomoNotice: v.optional(
		v.object({
			de: v.nullish(v.pipe(v.string(), v.nonEmpty())),
			en: v.nullish(v.pipe(v.string(), v.nonEmpty())),
		}),
	),
	projectNature: v.optional(
		v.object({
			de: v.nullish(v.pipe(v.string(), v.nonEmpty())),
			en: v.nullish(v.pipe(v.string(), v.nonEmpty())),
		}),
	),
	responsiblePersons: v.optional(
		v.object({
			de: v.nullish(v.pipe(v.string(), v.nonEmpty())),
			en: v.nullish(v.pipe(v.string(), v.nonEmpty())),
		}),
	),
	websiteAim: v.optional(
		v.object({
			de: v.nullish(v.pipe(v.string(), v.nonEmpty())),
			en: v.nullish(v.pipe(v.string(), v.nonEmpty())),
		}),
	),
});

export type ImprintConfig = v.InferOutput<typeof imprintConfigSchema>;

export function getImprintConfig(issue: RedmineIssue): ImprintConfig {
	const params = v.parse(
		imprintParamsSchema,
		issue.custom_fields.find((field) => field.name === "ImprintParams"),
	).value;

	const config = v.parse(
		imprintConfigSchema,
		/** Use YAML 1.1 to parse 'yes'/'no' on `hasMatomo` as booleans. */
		YAML.parse(params, { version: "1.1" }),
	);

	return config;
}
