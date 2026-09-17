import { type StructuredLoggerEnv, structuredLogger } from "@hono/structured-logger";
import type { Context } from "hono";
import type { RequestIdVariables } from "hono/request-id";
import pino, { type Logger } from "pino";

import { env } from "./env";

export type { Logger };

export type LoggerEnv = StructuredLoggerEnv<Logger>;

const rootLogger = pino({
	level: env.LOG_LEVEL,
	serializers: { err: pino.stdSerializers.errWithCause },
});

function logResponse(logger: Logger, c: Context, elapsedMs: number, error?: Error): void {
	const { status } = c.res;
	/** Client errors are expected, only log server errors at error level. */
	const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

	logger[level](
		{
			req: { method: c.req.method, url: c.req.url },
			res: { status },
			responseTime: Math.round(elapsedMs),
			err: error,
		},
		"Request completed",
	);
}

export function logger() {
	return structuredLogger<{ Variables: RequestIdVariables }, Logger>({
		createLogger(c) {
			return rootLogger.child({ reqId: c.get("requestId") });
		},
		onResponse(logger, c, elapsedMs) {
			logResponse(logger, c, elapsedMs);
		},
		onError(logger, error, c, elapsedMs) {
			logResponse(logger, c, elapsedMs, error);
		},
	});
}
