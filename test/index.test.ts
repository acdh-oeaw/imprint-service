/* eslint-disable @typescript-eslint/no-floating-promises */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import request from "supertest";

import { server } from "../src/server.js";

describe("healthcheck endpoint GET /", () => {
	it("should respond with 200 OK", () => {
		return request(server).get("/").expect(200);
	});
});

describe("imprint endpoint GET /:service-id", () => {
	it("should respond with html text when service id is valid", () => {
		const serviceId = 13777;
		return request(server)
			.get(`/${serviceId}`)
			.expect(200)
			.then((response) => {
				assert.match(response.text, /<h2>Legal disclosure/i);
			});
	});

	it("should respond with markdown when ?format=markdown query param is set", () => {
		const serviceId = 13777;
		return request(server)
			.get(`/${serviceId}/?format=markdown`)
			.expect(200)
			.then((response) => {
				assert.match(response.text, /## Legal disclosure/);
			});
	});

	it("should respond with german text when ?locale=de query param is set", () => {
		const serviceId = 13777;
		return request(server)
			.get(`/${serviceId}/?locale=de`)
			.expect(200)
			.then((response) => {
				assert.match(response.text, /<h2>Offenlegung/);
			});
	});

	it("should respond with german markdown when ?locale=de&format=de query params are set", () => {
		const serviceId = 13777;
		return request(server)
			.get(`/${serviceId}/?locale=de&format=markdown`)
			.expect(200)
			.then((response) => {
				assert.match(response.text, /## Offenlegung/);
			});
	});

	it("should respond with 400 Bad Request when service id is invalid", () => {
		const serviceId = "abc";
		return request(server).get(`/${serviceId}`).expect(400);
	});
});
