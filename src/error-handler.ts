import type { ErrorRequestHandler } from "express";

import { ServerError } from "./server-error.js";

export const errorHandler: ErrorRequestHandler = function errorHandler(
	error,
	_request,
	response,
	next,
) {
	if (response.headersSent) {
		next(error);
		return undefined;
	}

	const { message, statusCode } =
		error instanceof ServerError
			? { message: error.message, statusCode: error.statusCode }
			: { message: "Internal server error", statusCode: 500 };

	return response.status(statusCode).send({ message });
};
