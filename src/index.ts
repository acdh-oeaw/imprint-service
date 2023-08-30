import { env } from "./env.js";
import { server } from "./server.js";

server.listen(env.PORT, () => {
	// eslint-disable-next-line no-console
	console.info("🚀 ", `Server listening on port ${env.PORT}.`);
});
