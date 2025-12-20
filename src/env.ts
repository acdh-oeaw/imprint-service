import { err, isErr, ok } from "@acdh-oeaw/lib";
import { createEnv, ValidationError } from "@acdh-oeaw/validate-env/runtime";
import * as v from "valibot";

const result = createEnv({
	schema(environment) {
		const schema = v.object({
			LOG_LEVEL: v.optional(
				v.picklist(["silent", "fatal", "error", "warn", "info", "debug", "trace"]),
				"info",
			),
			NODE_ENV: v.optional(v.picklist(["development", "production", "test"]), "production"),
			PORT: v.optional(
				v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
				3000,
			),
			REDMINE_API_BASE_URL: v.pipe(v.string(), v.url()),
			REDMINE_USER: v.pipe(v.string(), v.nonEmpty()),
			REDMINE_PASSWORD: v.pipe(v.string(), v.nonEmpty()),
		});

		const result = v.safeParse(schema, environment);

		if (!result.success) {
			return err(
				new ValidationError(
					`Invalid or missing environment variables.\n${v.summarize(result.issues)}`,
				),
			);
		}

		return ok(result.output);
	},
	environment: {
		LOG_LEVEL: process.env.LOG_LEVEL,
		NODE_ENV: process.env.NODE_ENV,
		PORT: process.env.PORT,
		REDMINE_API_BASE_URL: process.env.REDMINE_API_BASE_URL,
		REDMINE_USER: process.env.REDMINE_USER,
		REDMINE_PASSWORD: process.env.REDMINE_PASSWORD,
	},
	validation: v.parse(
		v.optional(v.picklist(["disabled", "enabled"]), "enabled"),
		process.env.ENV_VALIDATION,
	),
});

if (isErr(result)) {
	delete result.error.stack;
	throw result.error;
}

export const env = result.value;
