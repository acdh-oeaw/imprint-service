export class ServerError extends Error {
	name = "ServerError";
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
	}
}
