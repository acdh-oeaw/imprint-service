import { describe, expect, it } from "bun:test";

import { convertMarkdownToHtml } from "./conversion";

describe("convertMarkdownToHtml", () => {
	it("should escape raw html", () => {
		const html = convertMarkdownToHtml("a <b>x</b> <script>alert(1)</script>\n\n<div>y</div>");
		expect(html).not.toMatch(/<(b|script|div)>/);
		expect(html).toContain("&lt;script&gt;");
	});

	it("should serialise void elements self-closing", () => {
		expect(convertMarkdownToHtml("a  \nb")).toContain("<br />");
	});
});
