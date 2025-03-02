/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import { HttpError, request } from "@acdh-oeaw/lib";
import cors from "cors";
import express from "express";
import templite from "templite";
import * as v from "valibot";
import { YAMLParseError } from "yaml";

import { locales } from "./config.js";
import { convertMarkdownToHtml, convertMarkdownToXHtml } from "./conversion.js";
import { env } from "./env.js";
import { errorHandler } from "./error-handler.js";
import { getImprintConfig } from "./imprint-config.js";
import { getRedmineIssueById } from "./redmine.js";
import { ServerError } from "./server-error.js";
import { getTemplate } from "./template.js";

const server = express();
server.use(cors());

/** Healthcheck, used by cluster. */
server.get("/", async (_req, res, next) => {
	try {
		/** Ensure redmine api is available. */
		await request(env.REDMINE_API_BASE_URL, { responseType: "void" });
		return res.send("OK");
	} catch (error) {
		if (error instanceof HttpError) {
			return next(new ServerError(error.response.status, error.response.statusText));
		}

		return next(error);
	}
});

const pathParamsSchema = v.object({
	serviceId: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
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

server.get("/:serviceId", async (req, res, next) => {
	try {
		const { serviceId } = v.parse(pathParamsSchema, req.params);
		const { locale, format } = v.parse(searchParamsSchema, req.query);

		const issue = await getRedmineIssueById(serviceId);
		const config = getImprintConfig(issue);
		const { template, partials } = getTemplate(locale, config);
		const markdown = templite(template, partials);

		switch (format) {
			case "html": {
				const html = convertMarkdownToHtml(markdown);
				return res.send(html);
			}

			case "markdown": {
				res.set("Content-Type", "text/markdown");
				return res.send(markdown);
			}

			case "xhtml": {
				const html = convertMarkdownToXHtml(markdown);
				return res.send(html);
			}

			default: {
				return next();
			}
		}
	} catch (error) {
		if (error instanceof YAMLParseError) {
			return next(
				new ServerError(
					400,
					"Validation error.\nReceived invalid YAML configuration from Redmine.",
				),
			);
		}

		if (v.isValiError(error)) {
			return next(
				new ServerError(
					400,
					"Validation error.\n" + JSON.stringify(v.flatten(error.issues).nested, null, 2),
				),
			);
		}

		if (error instanceof HttpError) {
			return next(new ServerError(error.response.status, error.response.statusText));
		}

		return next(error);
	}
});

server.use(errorHandler);

export { server };
