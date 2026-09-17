import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import * as v from "valibot";

import { locales } from "./config";
import { convertMarkdownToHtml } from "./conversion";
import { getImprintConfig, ImprintConfigParseError } from "./imprint-config";
import { logger, type LoggerEnv } from "./logger";
import { getRedmineIssueById, HttpError, pingRedmine, UnreachableError } from "./redmine";
import { renderTemplate } from "./template";
import { validator } from "./validator";

const app = new Hono<LoggerEnv>({ strict: false });

app.use(cors(), requestId(), logger());

/** Healthcheck, used by cluster. */
app.get("/", async (c) => {
	try {
		await pingRedmine();
	} catch (error) {
		throw new HTTPException(503, { cause: error, message: "Redmine api unavailable" });
	}

	return c.text("OK");
});

const pathParamsSchema = v.object({
	id: v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)),
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

const contentTypes = {
	html: "text/html",
	markdown: "text/markdown",
	xhtml: "application/xhtml+xml",
} satisfies Record<v.InferOutput<typeof searchParamsSchema>["format"], string>;

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
		const markdown = renderTemplate(locale, config);

		/** Void elements are serialised self-closing, so the html output is valid xhtml as well. */
		const body = format === "markdown" ? markdown : convertMarkdownToHtml(markdown);

		return c.text(body, 200, { "Content-Type": `${contentTypes[format]}; charset=UTF-8` });
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

	if (error instanceof UnreachableError) {
		return error.timedOut
			? { status: 504, message: "Redmine api timed out" }
			: { status: 502, message: "Redmine api unreachable" };
	}

	return { status: 500, message: "Internal server error" };
}

/** Errors are logged by the logger middleware. */
app.onError((error, c) => {
	const { status, message } = getErrorResponse(error);

	return c.json({ message }, status);
});

export default app;
