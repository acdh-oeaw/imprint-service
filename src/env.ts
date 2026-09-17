import * as v from "valibot";

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

/** Treat empty strings as unset, so optional variables fall back to their defaults. */
const environment = Object.fromEntries(
	Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value]),
);

const result = v.safeParse(schema, environment);

if (!result.success) {
	const error = new Error(
		`Invalid or missing environment variables.\n${v.summarize(result.issues)}`,
	);
	/** The stack trace is not useful for a configuration error. */
	delete error.stack;
	throw error;
}

export const env = Object.freeze(result.output);
