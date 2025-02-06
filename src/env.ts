import { z } from "zod";

const schema = z.object({
	PORT: z.coerce.number().default(3000),
	REDMINE_API_BASE_URL: z.string().url(),
	REDMINE_USER: z.string().min(1),
	REDMINE_PASSWORD: z.string().min(1),
});

const result = schema.safeParse(process.env);

if (!result.success) {
	const message = [
		"Invalid environment variables.",
		JSON.stringify(result.error.flatten().fieldErrors, null, 2),
	].join("\n");
	const error = new Error(message);
	delete error.stack;
	throw error;
}

export const env = result.data;
