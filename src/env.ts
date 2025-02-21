import * as v from "valibot";

const schema = v.object({
	PORT: v.optional(
		v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
		3000,
	),
	REDMINE_API_BASE_URL: v.pipe(v.string(), v.url()),
	REDMINE_USER: v.pipe(v.string(), v.nonEmpty()),
	REDMINE_PASSWORD: v.pipe(v.string(), v.nonEmpty()),
});

const result = v.safeParse(schema, process.env);

if (!result.success) {
	const message = [
		"Invalid environment variables.",
		JSON.stringify(v.flatten(result.issues).nested, null, 2),
	].join("\n");
	const error = new Error(message);
	delete error.stack;
	throw error;
}

export const env = result.output;
