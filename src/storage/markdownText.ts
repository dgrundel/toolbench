export function normalizeMarkdownContent(content: string): string {
  return content.replace(/\r\n/g, "\n");
}
