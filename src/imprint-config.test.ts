import { describe, expect, it } from "bun:test";

import { getImprintConfig, ImprintConfigParseError } from "./imprint-config";
import type { RedmineIssue } from "./redmine";

function createIssue(value?: unknown): RedmineIssue {
	return { custom_fields: value === undefined ? [] : [{ name: "ImprintParams", value }] };
}

describe("getImprintConfig", () => {
	it("should throw when config is missing or empty", () => {
		expect(() => getImprintConfig(createIssue())).toThrow(ImprintConfigParseError);
		expect(() => getImprintConfig(createIssue(""))).toThrow(ImprintConfigParseError);
		expect(() => getImprintConfig(createIssue("# only a comment"))).toThrow(
			ImprintConfigParseError,
		);
	});

	it("should parse yaml 1.1 booleans", () => {
		expect(getImprintConfig(createIssue("hasMatomo: yes")).hasMatomo).toBe(true);
		expect(getImprintConfig(createIssue("hasMatomo: No")).hasMatomo).toBe(false);
		expect(getImprintConfig(createIssue("hasMatomo: off")).hasMatomo).toBe(false);
		expect(getImprintConfig(createIssue("hasMatomo: true")).hasMatomo).toBe(true);
		expect(getImprintConfig(createIssue("hasMatomo: false")).hasMatomo).toBe(false);
	});

	it("should parse literal block scalars", () => {
		const config = getImprintConfig(createIssue("websiteAim:\n  de: |-\n    a\n    b"));
		expect(config.websiteAim?.de).toBe("a\nb");
	});

	it("should throw on invalid yaml", () => {
		expect(() => getImprintConfig(createIssue("a: ["))).toThrow(ImprintConfigParseError);
	});

	it("should throw on invalid config", () => {
		expect(() => getImprintConfig(createIssue("hasMatomo: maybe"))).toThrow(
			ImprintConfigParseError,
		);
	});
});
