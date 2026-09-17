/**
 * Raw html in markdown is allowed, because many imprint configs in redmine predate this service and
 * were authored as html, but it is reduced to a safe subset, so that custom text from redmine
 * cannot inject scripts or markup beyond simple formatting.
 *
 * The sanitizer runs over the complete output, so the allowlist must include every element the
 * markdown parser itself generates from the templates (images excluded on purpose).
 */
const allowedAttributes: Record<string, ReadonlySet<string>> = Object.fromEntries(
	[
		"a",
		"b",
		"blockquote",
		"br",
		"code",
		"del",
		"em",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"hr",
		"i",
		"li",
		"ol",
		"p",
		"pre",
		"strong",
		"table",
		"tbody",
		"td",
		"th",
		"thead",
		"tr",
		"ul",
	].map((tagName) => [tagName, tagName === "a" ? new Set(["href", "title"]) : new Set()]),
);

/** Elements whose content is meaningless without the element itself. */
const droppedElements = new Set(["script", "style"]);

const allowedHrefProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

function isAllowedHref(value: string): boolean {
	try {
		return allowedHrefProtocols.has(new URL(value).protocol);
	} catch {
		return false;
	}
}

const sanitizer = new HTMLRewriter().on("*", {
	element(element) {
		const allowed = allowedAttributes[element.tagName];

		if (allowed == null) {
			if (droppedElements.has(element.tagName)) {
				element.remove();
			} else {
				element.removeAndKeepContent();
			}
			return;
		}

		/** Copy first, since removing attributes while iterating over them would skip entries. */
		for (const [name, value] of Array.from(element.attributes)) {
			if (!allowed.has(name)) {
				element.removeAttribute(name);
			} else if (name === "href" && !isAllowedHref(value)) {
				element.removeAttribute(name);
			}
		}

		/** A link without a valid target is just text. */
		if (element.tagName === "a" && !element.hasAttribute("href")) {
			element.removeAndKeepContent();
		}
	},
});

/**
 * Markdown-generated void elements are serialised self-closing (`<br />`), but author-supplied html
 * is passed through as written. Configs for services consuming `?format=xhtml` (xslt pipelines) are
 * therefore required to write well-formed xhtml; the service deliberately does not repair it.
 */
export function convertMarkdownToHtml(markdown: string): string {
	return sanitizer.transform(Bun.markdown.html(markdown));
}
