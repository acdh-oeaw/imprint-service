import toHtml from "rehype-stringify";
import fromMarkdown from "remark-parse";
import toHast from "remark-rehype";
import { unified } from "unified";

const htmlProcessor = unified().use(fromMarkdown).use(toHast).use(toHtml);

export function convertMarkdownToHtml(markdown: string): string {
	return String(htmlProcessor.processSync(markdown));
}

/**
 * This is *not* a full-blown xhtml serialiser, but should be good enough for
 * this usecase.
 *
 * In case we really need it, we should switch to [`xast`](https://github.com/syntax-tree/xast).
 */
const xhtmlProcessor = unified()
	.use(fromMarkdown)
	.use(toHast)
	.use(toHtml, { closeSelfClosing: true });

export function convertMarkdownToXHtml(markdown: string): string {
	return String(xhtmlProcessor.processSync(markdown));
}
