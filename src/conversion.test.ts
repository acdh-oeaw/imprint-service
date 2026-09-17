import { describe, expect, it } from "bun:test";

import { convertMarkdownToHtml } from "./conversion";

describe("convertMarkdownToHtml", () => {
	it("should keep allowed inline html", () => {
		const html = convertMarkdownToHtml(
			'a<br>b <a href="mailto:x@y.at">x@y.at</a> <a href="https://x.at" title="t">x</a> <em>e</em>',
		);
		expect(html).toContain("a<br>b");
		expect(html).toContain('<a href="mailto:x@y.at">x@y.at</a>');
		expect(html).toContain('<a href="https://x.at" title="t">x</a>');
		expect(html).toContain("<em>e</em>");
	});

	it("should keep allowed block html", () => {
		const html = convertMarkdownToHtml("<h3>Title</h3>\n\n<p>Text<br/>more</p>");
		expect(html).toContain("<h3>Title</h3>");
		expect(html).toContain("<p>Text<br/>more</p>");
	});

	it("should drop scripts and styles including their content", () => {
		const html = convertMarkdownToHtml("a <script>alert(1)</script>b\n\n<style>p{}</style>");
		expect(html).not.toContain("script");
		expect(html).not.toContain("alert");
		expect(html).not.toContain("style");
	});

	it("should unwrap disallowed elements but keep their content", () => {
		const html = convertMarkdownToHtml('a <span class="x">b</span> <div>c</div> <img src=x>');
		expect(html).not.toMatch(/<(span|div|img)/);
		expect(html).toContain("a b");
		expect(html).toContain("c");
	});

	it("should strip disallowed attributes", () => {
		const html = convertMarkdownToHtml('<a href="https://x.at" onclick="alert(1)" class="c">x</a>');
		expect(html).toBe('<p><a href="https://x.at">x</a></p>\n');
	});

	it("should unwrap links with unsafe or invalid targets", () => {
		expect(convertMarkdownToHtml('<a href="javascript:alert(1)">x</a>')).toBe("<p>x</p>\n");
		expect(convertMarkdownToHtml('<a href="x@y.at">x</a>')).toBe("<p>x</p>\n");
		expect(convertMarkdownToHtml("<a>x</a>")).toBe("<p>x</p>\n");
	});

	it("should serialise markdown void elements self-closing", () => {
		expect(convertMarkdownToHtml("a  \nb")).toContain("<br />");
	});
});
