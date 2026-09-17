/**
 * Raw html in markdown is escaped, so that custom text from redmine cannot inject markup.
 *
 * Void elements are serialised self-closing (`<br />`), so the output is valid html as well as
 * xhtml.
 */
export function convertMarkdownToHtml(markdown: string): string {
	return Bun.markdown.html(markdown, { noHtmlBlocks: true, noHtmlSpans: true });
}
