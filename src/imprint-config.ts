import * as v from "valibot";

import type { RedmineIssue } from "./redmine";

const imprintParamsSchema = v.object({
	value: v.pipe(v.string(), v.nonEmpty()),
});

const imprintConfigSchema = v.object({
	/** We ignore `language` setting from redmine. */
	copyrightNotice: v.optional(
		v.object({
			de: v.nullish(v.pipe(v.string(), v.nonEmpty())),
			en: v.nullish(v.pipe(v.string(), v.nonEmpty())),
		}),
	),
	/**
	 * `Bun.YAML` implements YAML 1.2, which parses 'yes'/'no'/'on'/'off' as strings, so we accept
	 * those as booleans ourselves for backwards compatibility with YAML 1.1.
	 */
	hasMatomo: v.optional(
		v.union([
			v.boolean(),
			v.pipe(
				v.string(),
				v.toLowerCase(),
				v.picklist(["yes", "no", "on", "off"]),
				v.transform((input) => input === "yes" || input === "on"),
			),
		]),
		true,
	),
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

export class ImprintConfigParseError extends Error {
	constructor(options?: ErrorOptions) {
		super("Failed to parse imprint config", options);
		this.name = "ImprintConfigParseError";
	}
}

function parseYaml(input: string): unknown {
	try {
		return Bun.YAML.parse(input);
	} catch (error) {
		throw new ImprintConfigParseError({ cause: error });
	}
}

export function getImprintConfig(issue: RedmineIssue): ImprintConfig {
	const params = v.parse(
		imprintParamsSchema,
		issue.custom_fields.find((field) => field.name === "ImprintParams"),
	).value;

	const config = v.parse(imprintConfigSchema, parseYaml(params));

	return config;
}
