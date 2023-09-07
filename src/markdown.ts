import MarkdownIt from "markdown-it";

const renderer = new MarkdownIt();

export function convertMarkdownToHtml(markdown: string): string {
	return renderer.render(markdown);
}
