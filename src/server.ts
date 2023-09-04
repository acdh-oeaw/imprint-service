/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/no-misused-promises */

import { HttpError } from "@acdh-oeaw/lib";
import cors from "cors";
import express from "express";
import templite from "templite";
import { z, ZodError } from "zod";

import { locales } from "./config.js";
import { errorHandler } from "./error-handler.js";
import { getImprintConfig } from "./imprint-config.js";
import { convertMarkdownToHtml } from "./markdown.js";
import { getRedmineIssueById } from "./redmine.js";
import { ServerError } from "./server-error.js";
import { getTemplate } from "./template.js";

const server = express();
server.use(cors());

/** Healthcheck, used by cluster. */
server.get("/", (req, res) => {
	res.send("OK");
});

const pathParamsSchema = z.object({
	serviceId: z.coerce.number().int().positive(),
});

const searchParamsSchema = z.object({
	format: z.enum(["html", "markdown"]).default("html"),
	locale: z.enum(locales).default("en"),
});

server.get("/:serviceId", async (req, res, next) => {
	try {
		const { serviceId } = pathParamsSchema.parse(req.params);
		const { locale, format } = searchParamsSchema.parse(req.query);

		const issue = await getRedmineIssueById(serviceId);
		const config = getImprintConfig(issue);
		const { template, partials } = getTemplate(locale, config);
		const markdown = templite(template, partials);

		switch (format) {
			case "markdown": {
				res.set("Content-Type", "text/markdown");
				return res.send(markdown);
			}

			case "html": {
				const html = convertMarkdownToHtml(markdown);
				return res.send(html);
			}
		}
	} catch (error) {
		if (error instanceof ZodError) {
			return next(
				new ServerError(
					400,
					"Validation error.\n" + JSON.stringify(error.flatten().fieldErrors, null, 2),
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
