import { pinoLogger } from "hono-pino";
import pino from "pino";

import { env } from "./env";

export type { PinoLogger as Logger } from "hono-pino";

export function logger() {
	return pinoLogger({
		pino: pino({ level: env.LOG_LEVEL }),
	});
}
