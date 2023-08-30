import type * as undici from "undici";

/**
 * Types for the fetch api are currently missing from `@types/node`.
 *
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
 */

declare global {
	export const { fetch, FormData, Headers, Request, Response }: typeof undici;

	type BodyInit = undici.BodyInit;
	type FormData = undici.FormData;
	type Headers = undici.Headers;
	type HeadersInit = undici.HeadersInit;
	type Request = undici.Request;
	type RequestInfo = undici.RequestInfo;
	type RequestInit = undici.RequestInit;
	type Response = undici.Response;
}
