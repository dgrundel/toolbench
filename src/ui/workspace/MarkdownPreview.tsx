import { useMemo, useRef, type ReactNode } from "react";
import { normalizeMarkdownContent } from "../../storage/markdownText";

type MarkdownPreviewProps = {
  content: string;
  label: string;
  highlightMode?: boolean;
  onCreateHighlight?: (selection: MarkdownPreviewSelection) => void;
};

export type MarkdownPreviewSelection = {
  startOffset: number;
  endOffset: number;
  excerpt: string;
};

type InlineSegment =
  | { type: "text"; value: string; sourceStart: number; sourceEnd: number }
  | { type: "code"; value: string; sourceStart: number; sourceEnd: number }
  | { type: "strong"; value: InlineSegment[]; sourceStart: number; sourceEnd: number }
  | { type: "em"; value: InlineSegment[]; sourceStart: number; sourceEnd: number }
  | { type: "strike"; value: InlineSegment[]; sourceStart: number; sourceEnd: number }
  | { type: "link"; text: InlineSegment[]; href: string; sourceStart: number; sourceEnd: number };

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; content: InlineSegment[]; sourceStart: number; sourceEnd: number }
  | { type: "paragraph"; content: InlineSegment[]; sourceStart: number; sourceEnd: number }
  | { type: "blockquote"; content: InlineSegment[]; sourceStart: number; sourceEnd: number }
  | { type: "list"; ordered: boolean; items: InlineSegment[][]; sourceStart: number; sourceEnd: number }
  | { type: "code"; language: string; content: string; sourceStart: number; sourceEnd: number }
  | { type: "rule"; sourceStart: number; sourceEnd: number };

type LineEntry = {
  text: string;
  start: number;
  end: number;
};

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

export function MarkdownPreview({
  content,
  label,
  highlightMode = false,
  onCreateHighlight
}: MarkdownPreviewProps) {
  const blocks = useMemo(() => parseMarkdown(normalizeMarkdownContent(content)), [content]);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  function handleMouseUp() {
    if (!highlightMode || !surfaceRef.current) {
      return;
    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!surfaceRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const startOffset = getBoundaryOffset(range.startContainer, range.startOffset);
    const endOffset = getBoundaryOffset(range.endContainer, range.endOffset);

    if (startOffset === null || endOffset === null) {
      return;
    }

    const normalizedStart = Math.min(startOffset, endOffset);
    const normalizedEnd = Math.max(startOffset, endOffset);

    onCreateHighlight?.({
      startOffset: normalizedStart,
      endOffset: normalizedEnd,
      excerpt: normalizeExcerpt(selection.toString())
    });
  }

  return (
    <article className="markdown-preview" aria-label={label}>
      <div className="markdown-preview__surface" ref={surfaceRef} onMouseUp={handleMouseUp}>
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
  const blocks = parseMarkdown(normalizeMarkdownContent(content));

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
            <h1
              key={key}
              className="markdown-preview__heading markdown-preview__heading--1"
              data-source-start={block.sourceStart}
              data-source-end={block.sourceEnd}
            >
              {renderInlineSegments(block.content, key)}
            </h1>
          );
        case 2:
          return (
            <h2
              key={key}
              className="markdown-preview__heading markdown-preview__heading--2"
              data-source-start={block.sourceStart}
              data-source-end={block.sourceEnd}
            >
              {renderInlineSegments(block.content, key)}
            </h2>
          );
        case 3:
          return (
            <h3
              key={key}
              className="markdown-preview__heading markdown-preview__heading--3"
              data-source-start={block.sourceStart}
              data-source-end={block.sourceEnd}
            >
              {renderInlineSegments(block.content, key)}
            </h3>
          );
        case 4:
          return (
            <h4
              key={key}
              className="markdown-preview__heading markdown-preview__heading--4"
              data-source-start={block.sourceStart}
              data-source-end={block.sourceEnd}
            >
              {renderInlineSegments(block.content, key)}
            </h4>
          );
        case 5:
          return (
            <h5
              key={key}
              className="markdown-preview__heading markdown-preview__heading--5"
              data-source-start={block.sourceStart}
              data-source-end={block.sourceEnd}
            >
              {renderInlineSegments(block.content, key)}
            </h5>
          );
        case 6:
          return (
            <h6
              key={key}
              className="markdown-preview__heading markdown-preview__heading--6"
              data-source-start={block.sourceStart}
              data-source-end={block.sourceEnd}
            >
              {renderInlineSegments(block.content, key)}
            </h6>
          );
        default:
          return null;
      }
    case "paragraph":
      return (
        <p
          key={key}
          className="markdown-preview__paragraph"
          data-source-start={block.sourceStart}
          data-source-end={block.sourceEnd}
        >
          {renderInlineSegments(block.content, key)}
        </p>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="markdown-preview__blockquote"
          data-source-start={block.sourceStart}
          data-source-end={block.sourceEnd}
        >
          <p>{renderInlineSegments(block.content, key)}</p>
        </blockquote>
      );
    case "list":
      return block.ordered ? (
        <ol
          key={key}
          className="markdown-preview__list"
          data-source-start={block.sourceStart}
          data-source-end={block.sourceEnd}
        >
          {block.items.map((item, index) => (
            <li
              key={`${key}-item-${index}`}
              data-source-start={item[0]?.sourceStart}
              data-source-end={item[item.length - 1]?.sourceEnd}
            >
              {renderInlineSegments(item, `${key}-item-${index}`)}
            </li>
          ))}
        </ol>
      ) : (
        <ul
          key={key}
          className="markdown-preview__list"
          data-source-start={block.sourceStart}
          data-source-end={block.sourceEnd}
        >
          {block.items.map((item, index) => (
            <li
              key={`${key}-item-${index}`}
              data-source-start={item[0]?.sourceStart}
              data-source-end={item[item.length - 1]?.sourceEnd}
            >
              {renderInlineSegments(item, `${key}-item-${index}`)}
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <figure
          key={key}
          className="markdown-preview__codeblock"
          data-source-start={block.sourceStart}
          data-source-end={block.sourceEnd}
        >
          {block.language ? <figcaption className="markdown-preview__code-language">{block.language}</figcaption> : null}
          <pre className="markdown-preview__code">
            <code>{block.content}</code>
          </pre>
        </figure>
      );
    case "rule":
      return (
        <hr
          key={key}
          className="markdown-preview__rule"
          data-source-start={block.sourceStart}
          data-source-end={block.sourceEnd}
        />
      );
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
          return `<strong data-source-start="${segment.sourceStart}" data-source-end="${segment.sourceEnd}">${renderInlineSegmentsAsHtml(
            segment.value
          )}</strong>`;
        case "em":
          return `<em data-source-start="${segment.sourceStart}" data-source-end="${segment.sourceEnd}">${renderInlineSegmentsAsHtml(
            segment.value
          )}</em>`;
        case "strike":
          return `<del data-source-start="${segment.sourceStart}" data-source-end="${segment.sourceEnd}">${renderInlineSegmentsAsHtml(
            segment.value
          )}</del>`;
        case "link":
          return `<a data-source-start="${segment.sourceStart}" data-source-end="${segment.sourceEnd}" style="color:#0b73b9;text-decoration:none;border-bottom:1px solid rgba(0,122,204,0.22);" href="${escapeAttribute(
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

function getBoundaryOffset(container: Node, offset: number): number | null {
  const element = getSourceElement(container);

  if (!element) {
    return null;
  }

  const sourceStart = Number(element.dataset.sourceStart);

  if (!Number.isFinite(sourceStart)) {
    return null;
  }

  return sourceStart + offset;
}

function getSourceElement(container: Node): HTMLElement | null {
  if (container.nodeType === Node.ELEMENT_NODE) {
    return container as HTMLElement;
  }

  return container.parentElement?.closest<HTMLElement>("[data-source-start][data-source-end]") ?? null;
}

function normalizeExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function renderInlineSegments(segments: InlineSegment[], keyPrefix: string): ReactNode[] {
  return segments.map((segment, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (segment.type) {
      case "text":
        return (
          <span
            key={key}
            data-source-start={segment.sourceStart}
            data-source-end={segment.sourceEnd}
          >
            {segment.value}
          </span>
        );
      case "code":
        return (
          <code
            key={key}
            className="markdown-preview__inline-code"
            data-source-start={segment.sourceStart}
            data-source-end={segment.sourceEnd}
          >
            {segment.value}
          </code>
        );
      case "strong":
        return (
          <strong key={key} data-source-start={segment.sourceStart} data-source-end={segment.sourceEnd}>
            {renderInlineSegments(segment.value, key)}
          </strong>
        );
      case "em":
        return (
          <em key={key} data-source-start={segment.sourceStart} data-source-end={segment.sourceEnd}>
            {renderInlineSegments(segment.value, key)}
          </em>
        );
      case "strike":
        return (
          <del key={key} data-source-start={segment.sourceStart} data-source-end={segment.sourceEnd}>
            {renderInlineSegments(segment.value, key)}
          </del>
        );
      case "link":
        return (
          <a
            key={key}
            className="markdown-preview__link"
            href={segment.href}
            target="_blank"
            rel="noreferrer"
            data-source-start={segment.sourceStart}
            data-source-end={segment.sourceEnd}
          >
            {renderInlineSegments(segment.text, key)}
          </a>
        );
      default:
        return null;
    }
  });
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = buildLineTable(content);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.text.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line.text);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const contentStart = line.start + headingMatch[0].indexOf(headingMatch[2]);
      const contentEnd = contentStart + headingMatch[2].length;
      blocks.push({
        type: "heading",
        level,
        content: parseInline(headingMatch[2], contentStart),
        sourceStart: line.start,
        sourceEnd: contentEnd
      });
      index += 1;
      continue;
    }

    if (/^```/.test(line.text)) {
      const language = line.text.replace(/^```/, "").trim();
      const contentStart = index + 1 < lines.length ? lines[index + 1].start : line.end;
      let cursor = index + 1;

      while (cursor < lines.length && !/^```/.test(lines[cursor].text)) {
        cursor += 1;
      }

      const contentEnd = cursor < lines.length ? lines[cursor].start : contentStart;

      blocks.push({
        type: "code",
        language,
        content: content.slice(contentStart, contentEnd),
        sourceStart: line.start,
        sourceEnd: contentEnd
      });
      index = cursor < lines.length ? cursor + 1 : cursor;
      continue;
    }

    if (/^([-*_])\1\1+$/.test(line.text.trim())) {
      blocks.push({ type: "rule", sourceStart: line.start, sourceEnd: line.end });
      index += 1;
      continue;
    }

    const orderedListMatch = /^(\d+)\.\s+(.*)$/.exec(line.text);
    if (orderedListMatch) {
      const items: InlineSegment[][] = [];
      const listStart = line.start;
      let lastEnd = line.end;

      while (index < lines.length) {
        const itemLine = lines[index];
        const itemMatch = /^(\d+)\.\s+(.*)$/.exec(itemLine.text);

        if (!itemMatch) {
          break;
        }

        const itemContentStart = itemLine.start + itemLine.text.indexOf(itemMatch[2]);
        const itemContentEnd = itemContentStart + itemMatch[2].length;
        items.push(parseInline(itemMatch[2], itemContentStart));
        lastEnd = itemContentEnd;
        index += 1;
      }

      blocks.push({
        type: "list",
        ordered: true,
        items,
        sourceStart: listStart,
        sourceEnd: lastEnd
      });
      continue;
    }

    const unorderedListMatch = /^[-*+]\s+(.*)$/.exec(line.text);
    if (unorderedListMatch) {
      const items: InlineSegment[][] = [];
      const listStart = line.start;
      let lastEnd = line.end;

      while (index < lines.length) {
        const itemLine = lines[index];
        const itemMatch = /^[-*+]\s+(.*)$/.exec(itemLine.text);

        if (!itemMatch) {
          break;
        }

        const itemContentStart = itemLine.start + itemLine.text.indexOf(itemMatch[1]);
        const itemContentEnd = itemContentStart + itemMatch[1].length;
        items.push(parseInline(itemMatch[1], itemContentStart));
        lastEnd = itemContentEnd;
        index += 1;
      }

      blocks.push({
        type: "list",
        ordered: false,
        items,
        sourceStart: listStart,
        sourceEnd: lastEnd
      });
      continue;
    }

    if (/^>\s?/.test(line.text)) {
      const quoteLines: Array<{ text: string; start: number; end: number }> = [];
      const blockStart = line.start;
      let blockEnd = line.end;

      while (index < lines.length && /^>\s?/.test(lines[index].text)) {
        const quoteLine = lines[index];
        const prefixLength = quoteLine.text.match(/^>\s?/)?.[0].length ?? 1;
        const visibleText = quoteLine.text.slice(prefixLength);
        const visibleStart = quoteLine.start + prefixLength;
        const visibleEnd = visibleStart + visibleText.length;
        quoteLines.push({ text: visibleText, start: visibleStart, end: visibleEnd });
        blockEnd = visibleEnd;
        index += 1;
      }

      blocks.push({
        type: "blockquote",
        content: parseLineGroup(quoteLines),
        sourceStart: blockStart,
        sourceEnd: blockEnd
      });
      continue;
    }

    const paragraphLines: Array<{ text: string; start: number; end: number }> = [];
    const paragraphStart = line.start;
    let paragraphEnd = line.end;

    while (index < lines.length) {
      const currentLine = lines[index];

      if (!currentLine.text.trim()) {
        break;
      }

      if (
        /^(#{1,6})\s+/.test(currentLine.text) ||
        /^```/.test(currentLine.text) ||
        /^([-*_])\1\1+$/.test(currentLine.text.trim()) ||
        /^(\d+)\.\s+/.test(currentLine.text) ||
        /^[-*+]\s+/.test(currentLine.text) ||
        /^>\s?/.test(currentLine.text)
      ) {
        break;
      }

      const trimmed = currentLine.text.trim();
      const visibleStart = currentLine.start + currentLine.text.indexOf(trimmed);
      const visibleEnd = visibleStart + trimmed.length;
      paragraphLines.push({ text: trimmed, start: visibleStart, end: visibleEnd });
      paragraphEnd = visibleEnd;
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: parseLineGroup(paragraphLines),
        sourceStart: paragraphStart,
        sourceEnd: paragraphEnd
      });
      continue;
    }

    index += 1;
  }

  return blocks;
}

function parseLineGroup(lines: LineEntry[]): InlineSegment[] {
  const segments: InlineSegment[] = [];

  lines.forEach((line, index) => {
    segments.push(...parseInline(line.text, line.start));

    if (index < lines.length - 1) {
      segments.push({
        type: "text",
        value: " ",
        sourceStart: line.end,
        sourceEnd: line.end + 1
      });
    }
  });

  return segments;
}

function parseInline(input: string, sourceStart: number): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const remaining = input.slice(cursor);
    const nextMatch = findNextInlineMatch(remaining);

    if (!nextMatch) {
      if (remaining.length > 0) {
        segments.push({
          type: "text",
          value: remaining,
          sourceStart: sourceStart + cursor,
          sourceEnd: sourceStart + cursor + remaining.length
        });
      }
      break;
    }

    if (nextMatch.index > 0) {
      const text = remaining.slice(0, nextMatch.index);
      segments.push({
        type: "text",
        value: text,
        sourceStart: sourceStart + cursor,
        sourceEnd: sourceStart + cursor + text.length
      });
    }

    const matchStart = sourceStart + cursor + nextMatch.index;
    const segment = toInlineSegment(nextMatch.type, nextMatch.match, matchStart);

    if (segment) {
      segments.push(segment);
    }
    cursor += nextMatch.index + nextMatch.length;
  }

  return segments;
}

function findNextInlineMatch(
  input: string
): { index: number; length: number; type: InlineSegment["type"]; match: RegExpExecArray } | null {
  let bestMatch: { index: number; length: number; type: InlineSegment["type"]; match: RegExpExecArray } | null = null;

  for (const pattern of INLINE_PATTERNS) {
    const match = pattern.regex.exec(input);

    if (!match || match.index === undefined) {
      continue;
    }

    if (!bestMatch || match.index < bestMatch.index) {
      bestMatch = {
        index: match.index,
        length: match[0].length,
        type: pattern.type,
        match
      };
    }
  }

  return bestMatch;
}

function toInlineSegment(type: InlineSegment["type"], match: RegExpExecArray, matchStart: number): InlineSegment | null {
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
        text: parseInline(text, matchStart + 1),
        href,
        sourceStart: matchStart,
        sourceEnd: matchStart + match[0].length
      };
    }
    case "code":
      return {
        type: "code",
        value: match[1],
        sourceStart: matchStart + 1,
        sourceEnd: matchStart + 1 + match[1].length
      };
    case "strong":
      return {
        type: "strong",
        value: parseInline(match[2], matchStart + match[1].length),
        sourceStart: matchStart,
        sourceEnd: matchStart + match[0].length
      };
    case "em":
      return {
        type: "em",
        value: parseInline(match[2], matchStart + match[1].length),
        sourceStart: matchStart,
        sourceEnd: matchStart + match[0].length
      };
    case "strike":
      return {
        type: "strike",
        value: parseInline(match[1], matchStart + 2),
        sourceStart: matchStart,
        sourceEnd: matchStart + match[0].length
      };
    default:
      return null;
  }
}

function buildLineTable(content: string): LineEntry[] {
  const lines = content.split("\n");
  const entries: LineEntry[] = [];
  let cursor = 0;

  for (const line of lines) {
    const start = cursor;
    const end = start + line.length;
    entries.push({ text: line, start, end });
    cursor = end + 1;
  }

  return entries;
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
