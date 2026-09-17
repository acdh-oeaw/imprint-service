import { describe, expect, it } from "bun:test";

import app from ".";

const baseUrl = "http://localhost:3000";

function createUrl(params: { pathname: string; searchParams?: Record<string, string> }): URL {
	const url = new URL(params.pathname, baseUrl);
	if (params.searchParams != null) {
		url.search = String(new URLSearchParams(params.searchParams));
	}
	return url;
}

describe("healthcheck endpoint GET /", () => {
	it("should respond with 200 OK", async () => {
		const req = new Request(
			String(
				createUrl({
					pathname: "/",
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
	});
});

describe("imprint endpoint GET /:id", () => {
	it("should respond with html text when service id is valid", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br \/>/);
		const contentType = res.headers.get("Content-Type");
		expect(contentType).toBe("text/html; charset=UTF-8");
	});

	it("should work with trailing slash", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}/`,
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br \/>/);
	});

	it("should reponse with default text when ?redmine=disabled", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}/`,
					searchParams: {
						redmine: "disabled",
					},
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br \/>/);
	});

	it("should respond with markdown when ?format=markdown query param is set", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
					searchParams: {
						format: "markdown",
					},
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/## Legal disclosure/i);
		const contentType = res.headers.get("Content-Type");
		expect(contentType).toBe("text/markdown; charset=UTF-8");
	});

	it("should respond with xhtml when ?format=xhtml query param is set", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
					searchParams: {
						format: "xhtml",
					},
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br \/>/);
		const contentType = res.headers.get("Content-Type");
		expect(contentType).toBe("application/xhtml+xml; charset=UTF-8");
	});

	it("should respond with german text when ?locale=de query param is set", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
					searchParams: {
						locale: "de",
					},
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Offenlegung/i);
	});

	it("should respond with german text when ?locale=de-AT query param is set", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
					searchParams: {
						locale: "de-AT",
					},
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Offenlegung/i);
	});

	it("should respond with german markdown when ?locale=de&format=markdown query params are set", async () => {
		const serviceId = 21966;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
					searchParams: {
						locale: "de",
						format: "markdown",
					},
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/## Offenlegung/i);
	});

	it("should respond with 404 Not Found when service id does not exist", async () => {
		const serviceId = 999999999;
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(404);
	});

	it("should respond with 400 Bad Request when service id is invalid", async () => {
		const serviceId = "abc";
		const req = new Request(
			String(
				createUrl({
					pathname: `/${String(serviceId)}`,
				}),
			),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(400);
	});
});
