import { describe, expect, it } from "bun:test";

import { createUrl, createUrlSearchParams } from "@acdh-oeaw/lib";

import app from ".";

const baseUrl = "http://localhost:3000";

describe("healthcheck endpoint GET /", () => {
	it("should respond with 200 OK", async () => {
		const req = new Request(
			createUrl({
				baseUrl,
				pathname: "/",
			}),
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
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
			}),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br>/);
		const contentType = res.headers.get("Content-Type");
		expect(contentType).toBe("text/html; charset=UTF-8");
	});

	it("should work with trailing slash", async () => {
		const serviceId = 21966;
		const req = new Request(
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}/`,
			}),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br>/);
	});

	it("should reponse with default text when ?redmine=disabled", async () => {
		const serviceId = 21966;
		const req = new Request(
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}/`,
				searchParams: createUrlSearchParams({
					redmine: "disabled",
				}),
			}),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/<h2>Legal disclosure/i);
		expect(text).toMatch(/<br>/);
	});

	it("should respond with markdown when ?format=markdown query param is set", async () => {
		const serviceId = 21966;
		const req = new Request(
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
				searchParams: createUrlSearchParams({
					format: "markdown",
				}),
			}),
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
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
				searchParams: createUrlSearchParams({
					format: "xhtml",
				}),
			}),
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
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
				searchParams: createUrlSearchParams({
					locale: "de",
				}),
			}),
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
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
				searchParams: createUrlSearchParams({
					locale: "de-AT",
				}),
			}),
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
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
				searchParams: createUrlSearchParams({
					locale: "de",
					format: "markdown",
				}),
			}),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(200);
		const text = await res.text();
		expect(text).toMatch(/## Offenlegung/i);
	});

	it("should respond with 400 Bad Request when service id is invalid", async () => {
		const serviceId = "abc";
		const req = new Request(
			createUrl({
				baseUrl,
				pathname: `/${String(serviceId)}`,
			}),
		);
		const res = await app.request(req);
		const status = res.status;
		expect(status).toBe(400);
	});
});
