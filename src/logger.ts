import { pinoLogger } from "hono-pino";
import pino from "pino";

import { env } from "./env";

export type { PinoLogger as Logger } from "hono-pino";

export function logger() {
	return pinoLogger({
		pino: pino({ level: env.LOG_LEVEL }),
		http: {
			/** Client errors are expected, only log server errors at error level. */
			onResLevel(c) {
				if (c.res.status >= 500) {
					return "error";
				}
				if (c.res.status >= 400) {
					return "warn";
				}
				return "info";
			},
		},
	});
}
