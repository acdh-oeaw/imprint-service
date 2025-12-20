import { HttpError, request } from "@acdh-oeaw/lib";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import templite from "templite";
import * as v from "valibot";
import { YAMLParseError } from "yaml";

import { locales } from "./config";
import { convertMarkdownToHtml, convertMarkdownToXHtml } from "./conversion";
import { env } from "./env";
import { getImprintConfig } from "./imprint-config";
import { logger, type Logger } from "./logger";
import { getRedmineIssueById } from "./redmine";
import { getTemplate } from "./template";
import { validator } from "./validator";

const app = new Hono<{ Variables: { logger: Logger } }>({ strict: false });

app.use(cors(), requestId(), logger());

/** Healthcheck, used by cluster. */
app.get("/", async (c) => {
	/** Ensure redmine api is available. */
	await request(env.REDMINE_API_BASE_URL, { responseType: "void" });

	return c.text("OK");
});

const pathParamsSchema = v.object({
	id: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
});

const searchParamsSchema = v.object({
	format: v.optional(v.picklist(["html", "markdown", "xhtml"]), "html"),
	locale: v.optional(
		v.pipe(
			v.string(),
			v.transform((input) => new Intl.Locale(input).language),
			v.picklist(locales),
		),
		"en",
	),
});

app.get(
	"/:id",
	validator("param", pathParamsSchema),
	validator("query", searchParamsSchema),
	async (c) => {
		const { id: serviceId } = c.req.valid("param");
		const { format, locale } = c.req.valid("query");

		const issue = await getRedmineIssueById(serviceId);
		const config = getImprintConfig(issue);
		const { template, partials } = getTemplate(locale, config);
		const markdown = templite(template, partials);

		switch (format) {
			case "html": {
				const html = convertMarkdownToHtml(markdown);
				return c.text(html, 200, { "Content-Type": "text/html" });
			}

			case "markdown": {
				return c.text(markdown, 200, { "Content-Type": "text/markdown" });
			}

			case "xhtml": {
				const html = convertMarkdownToXHtml(markdown);
				return c.text(html, 200, { "Content-Type": "application/xhtml+xml" });
			}
		}
	},
);

app.notFound((c) => {
	return c.json({ message: "Not found" }, 404);
});

app.onError((error, c) => {
	const { logger } = c.var;

	logger.error(error);

	if (error instanceof HTTPException) {
		return error.getResponse();
	}

	if (error instanceof YAMLParseError) {
		return c.json({ message: "Invalid redmine config" }, 400);
	}

	if (error instanceof HttpError) {
		const status = error.response.status;

		if (status === 401 || status === 403) {
			return c.json({ message: "Missing or invalid credentials for redmine api" }, status);
		}

		return c.json({ message: "Upstream redmine error" }, 500);
	}

	return c.json({ message: "Internal server error" }, 500);
});

export default app;
