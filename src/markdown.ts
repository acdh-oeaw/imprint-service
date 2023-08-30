import toHtml from "rehype-stringify";
import fromMarkdown from "remark-parse";
import toHast from "remark-rehype";
import { unified } from "unified";

// @ts-expect-error Upstream type issue.
const processor = unified().use(fromMarkdown).use(toHast).use(toHtml);

export function convertMarkdownToHtml(markdown: string): string {
	return String(processor.processSync(markdown));
}
