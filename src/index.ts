import { HttpError, request } from "@acdh-oeaw/lib";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import templite from "templite";
import * as v from "valibot";

import { locales } from "./config";
import { convertMarkdownToHtml } from "./conversion";
import { env } from "./env";
import { getImprintConfig, ImprintConfigParseError } from "./imprint-config";
import { logger, type Logger } from "./logger";
import { getRedmineIssueById } from "./redmine";
import { getTemplate } from "./template";
import { validator } from "./validator";

const app = new Hono<{ Variables: { logger: Logger } }>({ strict: false });

app.use(cors(), requestId(), logger());

/** Healthcheck, used by cluster. */
app.get("/", async (c) => {
	/** Ensure redmine api is available. */
	try {
		await request(env.REDMINE_API_BASE_URL, { responseType: "void" });
	} catch (error) {
		throw new HTTPException(503, { cause: error, message: "Redmine api unavailable" });
	}

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
	redmine: v.optional(v.picklist(["disabled", "enabled"]), "enabled"),
});

app.get(
	"/:id",
	validator("param", pathParamsSchema),
	validator("query", searchParamsSchema),
	async (c) => {
		const { id: serviceId } = c.req.valid("param");
		const { format, locale, redmine } = c.req.valid("query");

		const config =
			redmine !== "disabled"
				? getImprintConfig(await getRedmineIssueById(serviceId))
				: { hasMatomo: true };
		const { template, partials } = getTemplate(locale, config);
		const markdown = templite(template, partials);

		switch (format) {
			case "html": {
				const html = convertMarkdownToHtml(markdown);
				return c.text(html, 200, { "Content-Type": "text/html; charset=UTF-8" });
			}

			case "markdown": {
				return c.text(markdown, 200, { "Content-Type": "text/markdown; charset=UTF-8" });
			}

			case "xhtml": {
				const html = convertMarkdownToHtml(markdown);
				return c.text(html, 200, { "Content-Type": "application/xhtml+xml; charset=UTF-8" });
			}
		}
	},
);

app.notFound((c) => {
	return c.json({ message: "Not found" }, 404);
});

interface ErrorResponse {
	status: ContentfulStatusCode;
	message: string;
}

function getErrorResponse(error: unknown): ErrorResponse {
	if (error instanceof HTTPException) {
		return { status: error.status, message: error.message };
	}

	if (error instanceof ImprintConfigParseError) {
		return { status: 400, message: `Invalid redmine config: ${error.message}` };
	}

	if (error instanceof HttpError) {
		const status = error.response.status;

		if (status === 401 || status === 403) {
			return { status, message: "Missing or invalid credentials for redmine api" };
		}

		if (status === 404) {
			return { status, message: "Redmine issue not found" };
		}

		return { status: 502, message: "Upstream redmine error" };
	}

	return { status: 500, message: "Internal server error" };
}

app.onError((error, c) => {
	const { logger } = c.var;

	const { status, message } = getErrorResponse(error);

	/** Client errors are expected, only log server errors at error level. */
	if (status >= 500) {
		logger.error(error);
	} else {
		logger.warn(error);
	}

	return c.json({ message }, status);
});

export default app;
