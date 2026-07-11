import { useMemo, type ReactNode } from "react";

type MarkdownPreviewProps = {
  content: string;
  label: string;
};

type InlineSegment =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; value: InlineSegment[] }
  | { type: "em"; value: InlineSegment[] }
  | { type: "strike"; value: InlineSegment[] }
  | { type: "link"; text: InlineSegment[]; href: string };

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; content: InlineSegment[] }
  | { type: "paragraph"; content: InlineSegment[] }
  | { type: "blockquote"; content: InlineSegment[] }
  | { type: "list"; ordered: boolean; items: InlineSegment[][] }
  | { type: "code"; language: string; content: string }
  | { type: "rule" };

const INLINE_PATTERNS: Array<{
  type: InlineSegment["type"];
  regex: RegExp;
}> = [
  { type: "link", regex: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { type: "code", regex: /`([^`]+)`/ },
  { type: "strong", regex: /(\*\*|__)(.+?)\1/ },
  { type: "strike", regex: /~~(.+?)~~/ },
  { type: "em", regex: /(\*|_)(.+?)\1/ }
];

export function MarkdownPreview({ content, label }: MarkdownPreviewProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <article className="markdown-preview" aria-label={label}>
      <div className="markdown-preview__surface">
        {blocks.length > 0 ? (
          blocks.map((block, index) => renderBlock(block, `${label}-${index}`))
        ) : (
          <div className="markdown-preview__empty">
            <p className="markdown-preview__empty-message">This document is empty.</p>
          </div>
        )}
      </div>
    </article>
  );
}

export function markdownToClipboardHtml(content: string): string {
  const blocks = parseMarkdown(content);

  if (blocks.length === 0) {
    return "";
  }

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#2a313b;line-height:1.7;">${blocks
    .map((block) => renderBlockAsHtml(block))
    .join("")}</div>`;
}

function renderBlock(block: MarkdownBlock, key: string): ReactNode {
  switch (block.type) {
    case "heading":
      switch (block.level) {
        case 1:
          return (
            <h1 key={key} className="markdown-preview__heading markdown-preview__heading--1">
              {renderInlineSegments(block.content, key)}
            </h1>
          );
        case 2:
          return (
            <h2 key={key} className="markdown-preview__heading markdown-preview__heading--2">
              {renderInlineSegments(block.content, key)}
            </h2>
          );
        case 3:
          return (
            <h3 key={key} className="markdown-preview__heading markdown-preview__heading--3">
              {renderInlineSegments(block.content, key)}
            </h3>
          );
        case 4:
          return (
            <h4 key={key} className="markdown-preview__heading markdown-preview__heading--4">
              {renderInlineSegments(block.content, key)}
            </h4>
          );
        case 5:
          return (
            <h5 key={key} className="markdown-preview__heading markdown-preview__heading--5">
              {renderInlineSegments(block.content, key)}
            </h5>
          );
        case 6:
          return (
            <h6 key={key} className="markdown-preview__heading markdown-preview__heading--6">
              {renderInlineSegments(block.content, key)}
            </h6>
          );
        default:
          return null;
      }
    case "paragraph":
      return (
        <p key={key} className="markdown-preview__paragraph">
          {renderInlineSegments(block.content, key)}
        </p>
      );
    case "blockquote":
      return (
        <blockquote key={key} className="markdown-preview__blockquote">
          <p>{renderInlineSegments(block.content, key)}</p>
        </blockquote>
      );
    case "list":
      return block.ordered ? (
        <ol key={key} className="markdown-preview__list">
          {block.items.map((item, index) => (
            <li key={`${key}-item-${index}`}>{renderInlineSegments(item, `${key}-item-${index}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="markdown-preview__list">
          {block.items.map((item, index) => (
            <li key={`${key}-item-${index}`}>{renderInlineSegments(item, `${key}-item-${index}`)}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <figure key={key} className="markdown-preview__codeblock">
          {block.language ? <figcaption className="markdown-preview__code-language">{block.language}</figcaption> : null}
          <pre className="markdown-preview__code">
            <code>{block.content}</code>
          </pre>
        </figure>
      );
    case "rule":
      return <hr key={key} className="markdown-preview__rule" />;
    default:
      return null;
  }
}

function renderBlockAsHtml(block: MarkdownBlock): string {
  switch (block.type) {
    case "heading": {
      const level = block.level;
      const size = headingSizeForLevel(level);
      const styles = [
        "margin:0 0 0.8em",
        "color:#202631",
        "font-weight:700",
        "line-height:1.2",
        "letter-spacing:-0.01em",
        `font-size:${size}`
      ].join(";");

      return `<h${level} style="${styles}">${renderInlineSegmentsAsHtml(block.content)}</h${level}>`;
    }
    case "paragraph":
      return `<p style="margin:0 0 1em;font-size:0.98rem;line-height:1.75;color:#303743;">${renderInlineSegmentsAsHtml(
        block.content
      )}</p>`;
    case "blockquote":
      return `<blockquote style="margin:0 0 1em;padding:0.85em 1.1em;border-left:4px solid #007acc;background:#f6f9fc;color:#4e5967;"><p style="margin:0;">${renderInlineSegmentsAsHtml(
        block.content
      )}</p></blockquote>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map(
          (item) =>
            `<li style="margin:0.35em 0;padding-left:0.2em;line-height:1.7;">${renderInlineSegmentsAsHtml(item)}</li>`
        )
        .join("");

      return `<${tag} style="margin:0 0 1em 1.35em;padding:0;color:#303743;">${items}</${tag}>`;
    }
    case "code":
      return `<figure style="margin:0 0 1em;">${block.language ? `<figcaption style="margin:0 0 0.3rem;color:#7a808c;font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(
        block.language
      )}</figcaption>` : ""}<pre style="margin:0;padding:16px 18px;overflow:auto;background:#f3f5f8;border:1px solid #dde2ea;color:#2f3441;font-family:'Cascadia Code','SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:0.92rem;line-height:1.7;"><code>${escapeHtml(
        block.content
      )}</code></pre></figure>`;
    case "rule":
      return `<hr style="margin:1.35em 0;border:0;border-top:1px solid #dde2ea;" />`;
    default:
      return "";
  }
}

function renderInlineSegmentsAsHtml(segments: InlineSegment[]): string {
  return segments
    .map((segment) => {
      switch (segment.type) {
        case "text":
          return escapeHtml(segment.value);
        case "code":
          return `<code style="padding:0.14em 0.35em;border:1px solid #dde2ea;background:#f3f5f8;color:#2f3441;font-family:'Cascadia Code','SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:0.92em;border-radius:3px;">${escapeHtml(
            segment.value
          )}</code>`;
        case "strong":
          return `<strong>${renderInlineSegmentsAsHtml(segment.value)}</strong>`;
        case "em":
          return `<em>${renderInlineSegmentsAsHtml(segment.value)}</em>`;
        case "strike":
          return `<del>${renderInlineSegmentsAsHtml(segment.value)}</del>`;
        case "link":
          return `<a style="color:#0b73b9;text-decoration:none;border-bottom:1px solid rgba(0,122,204,0.22);" href="${escapeAttribute(
            segment.href
          )}" target="_blank" rel="noreferrer">${renderInlineSegmentsAsHtml(segment.text)}</a>`;
        default:
          return "";
      }
    })
    .join("");
}

function headingSizeForLevel(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  switch (level) {
    case 1:
      return "2.2rem";
    case 2:
      return "1.75rem";
    case 3:
      return "1.42rem";
    case 4:
      return "1.2rem";
    case 5:
      return "1.05rem";
    case 6:
      return "0.92rem";
  }
}

function renderInlineSegments(segments: InlineSegment[], keyPrefix: string): ReactNode[] {
  return segments.map((segment, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (segment.type) {
      case "text":
        return segment.value;
      case "code":
        return (
          <code key={key} className="markdown-preview__inline-code">
            {segment.value}
          </code>
        );
      case "strong":
        return <strong key={key}>{renderInlineSegments(segment.value, key)}</strong>;
      case "em":
        return <em key={key}>{renderInlineSegments(segment.value, key)}</em>;
      case "strike":
        return <del key={key}>{renderInlineSegments(segment.value, key)}</del>;
      case "link":
        return (
          <a key={key} className="markdown-preview__link" href={segment.href} target="_blank" rel="noreferrer">
            {renderInlineSegments(segment.text, key)}
          </a>
        );
      default:
        return null;
    }
  });
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        type: "heading",
        level,
        content: parseInline(headingMatch[2])
      });
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const language = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        language,
        content: codeLines.join("\n")
      });
      continue;
    }

    if (/^([-*_])\1\1+$/.test(line.trim())) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    const orderedListMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (orderedListMatch) {
      const items: InlineSegment[][] = [];

      while (index < lines.length) {
        const itemMatch = /^(\d+)\.\s+(.*)$/.exec(lines[index]);

        if (!itemMatch) {
          break;
        }

        items.push(parseInline(itemMatch[2]));
        index += 1;
      }

      blocks.push({
        type: "list",
        ordered: true,
        items
      });
      continue;
    }

    const unorderedListMatch = /^[-*+]\s+(.*)$/.exec(line);
    if (unorderedListMatch) {
      const items: InlineSegment[][] = [];

      while (index < lines.length) {
        const itemMatch = /^[-*+]\s+(.*)$/.exec(lines[index]);

        if (!itemMatch) {
          break;
        }

        items.push(parseInline(itemMatch[1]));
        index += 1;
      }

      blocks.push({
        type: "list",
        ordered: false,
        items
      });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        type: "blockquote",
        content: parseInline(quoteLines.join(" "))
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const currentLine = lines[index];

      if (!currentLine.trim()) {
        break;
      }

      if (
        /^(#{1,6})\s+/.test(currentLine) ||
        /^```/.test(currentLine) ||
        /^([-*_])\1\1+$/.test(currentLine.trim()) ||
        /^(\d+)\.\s+/.test(currentLine) ||
        /^[-*+]\s+/.test(currentLine) ||
        /^>\s?/.test(currentLine)
      ) {
        break;
      }

      paragraphLines.push(currentLine.trim());
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: parseInline(paragraphLines.join(" "))
      });
      continue;
    }

    index += 1;
  }

  return blocks;
}

function parseInline(input: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const remaining = input.slice(cursor);
    const nextMatch = findNextInlineMatch(remaining);

    if (!nextMatch) {
      if (remaining.length > 0) {
        segments.push({ type: "text", value: remaining });
      }
      break;
    }

    if (nextMatch.index > 0) {
      segments.push({ type: "text", value: remaining.slice(0, nextMatch.index) });
    }

    segments.push(nextMatch.segment);
    cursor += nextMatch.index + nextMatch.length;
  }

  return segments;
}

function findNextInlineMatch(input: string): { index: number; length: number; segment: InlineSegment } | null {
  let bestMatch: { index: number; length: number; segment: InlineSegment } | null = null;

  for (const pattern of INLINE_PATTERNS) {
    const match = pattern.regex.exec(input);

    if (!match || match.index === undefined) {
      continue;
    }

    const candidate = toInlineSegment(pattern.type, match);

    if (!candidate) {
      continue;
    }

    if (!bestMatch || match.index < bestMatch.index) {
      bestMatch = {
        index: match.index,
        length: match[0].length,
        segment: candidate
      };
    }
  }

  return bestMatch;
}

function toInlineSegment(type: InlineSegment["type"], match: RegExpExecArray): InlineSegment | null {
  switch (type) {
    case "link": {
      const text = match[1];
      const href = safeHref(match[2]);

      if (!href) {
        return {
          type: "text",
          value: match[0]
        };
      }

      return {
        type: "link",
        text: parseInline(text),
        href
      };
    }
    case "code":
      return {
        type: "code",
        value: match[1]
      };
    case "strong":
      return {
        type: "strong",
        value: parseInline(match[2])
      };
    case "em":
      return {
        type: "em",
        value: parseInline(match[2])
      };
    case "strike":
      return {
        type: "strike",
        value: parseInline(match[1])
      };
    default:
      return null;
  }
}

function safeHref(href: string): string | null {
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(href)) {
    return href;
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
