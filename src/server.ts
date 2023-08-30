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

const searchParamsSchema = z.object({
	format: z.enum(["html", "markdown"]).default("html"),
	outputLang: z.enum(locales).default("en"),
	serviceID: z.coerce.number().int().positive(),
});

server.get("/", async (req, res, next) => {
	try {
		const {
			outputLang: locale,
			format,
			serviceID: serviceId,
		} = searchParamsSchema.parse(req.query);

		const issue = await getRedmineIssueById(serviceId);
		const config = getImprintConfig(issue);
		const { template, partials } = getTemplate(locale, config);
		const markdown = templite(template, partials);

		switch (format) {
			case "markdown": {
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
