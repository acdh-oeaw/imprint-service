export class ServerError extends Error {
	name = "ServerError";

	constructor(
		public statusCode: number,
		message: string,
	) {
		super(message);
	}
}
