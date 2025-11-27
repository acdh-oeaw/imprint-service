import { env } from "./env.ts";
import { server } from "./server.ts";

server.listen(env.PORT, () => {
	// eslint-disable-next-line no-console
	console.info("🚀 ", `Server listening on port ${String(env.PORT)}.`);
});
