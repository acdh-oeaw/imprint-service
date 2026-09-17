import * as v from "valibot";

import type { RedmineIssue } from "./redmine";

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
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "ImprintConfigParseError";
	}
}

function parseYaml(input: string): unknown {
	try {
		return Bun.YAML.parse(input);
	} catch (error) {
		throw new ImprintConfigParseError(error instanceof Error ? error.message : "Invalid yaml", {
			cause: error,
		});
	}
}

export function getImprintConfig(issue: RedmineIssue): ImprintConfig {
	const params = issue.custom_fields.find((field) => field.name === "ImprintParams")?.value;

	/** Redmine returns an empty string for unset custom fields. */
	if (typeof params !== "string" || params.trim() === "") {
		throw new ImprintConfigParseError('Missing "ImprintParams" custom field');
	}

	const result = v.safeParse(imprintConfigSchema, parseYaml(params));

	if (!result.success) {
		throw new ImprintConfigParseError(v.summarize(result.issues), { cause: result.issues });
	}

	return result.output;
}
