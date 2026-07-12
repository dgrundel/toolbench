import { createElement, useMemo, useRef, type CSSProperties } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMarkdownContent } from "../../storage/markdownText";

type MarkdownPreviewProps = {
  content: string;
  label: string;
  highlightMode?: boolean;
  highlights?: MarkdownPreviewHighlight[];
  onCreateHighlight?: (selection: MarkdownPreviewSelection) => void;
};

export type MarkdownPreviewSelection = {
  startOffset: number;
  endOffset: number;
  excerpt: string;
};

export type MarkdownPreviewHighlight = {
  startOffset: number;
  endOffset: number;
};

type RenderMode = "preview" | "clipboard";

type SourcePosition = {
  start?: { offset?: number };
  end?: { offset?: number };
};

type MarkdownNode = {
  position?: SourcePosition;
  properties?: Record<string, unknown>;
  children?: MarkdownNode[];
  tagName?: string;
  type?: string;
  value?: string;
};

type HighlightFragment = {
  text: string;
  sourceStart: number;
  sourceEnd: number;
  highlighted: boolean;
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeWrapTextNodes];

export function MarkdownPreview({
  content,
  label,
  highlightMode = false,
  highlights = [],
  onCreateHighlight
}: MarkdownPreviewProps) {
  const markdown = useMemo(() => normalizeMarkdownContent(content), [content]);
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

    if (surfaceRef.current.contains(selection.anchorNode) || surfaceRef.current.contains(selection.focusNode)) {
      selection.removeAllRanges();
    }
  }

  return (
    <article className="markdown-preview" aria-label={label}>
      <div className="markdown-preview__surface" ref={surfaceRef} onMouseUp={handleMouseUp}>
        {markdown.trim().length > 0 ? (
          <MarkdownContent markdown={markdown} highlights={highlights} mode="preview" />
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
  const markdown = normalizeMarkdownContent(content);

  if (markdown.trim().length === 0) {
    return "";
  }

  return renderToStaticMarkup(
    <div
      style={{
        fontFamily: "Segoe UI,Arial,sans-serif",
        color: "#2a313b",
        lineHeight: 1.7
      }}
    >
      <MarkdownContent markdown={markdown} highlights={[]} mode="clipboard" />
    </div>
  );
}

function MarkdownContent({
  markdown,
  highlights,
  mode
}: {
  markdown: string;
  highlights: MarkdownPreviewHighlight[];
  mode: RenderMode;
}) {
  const components = useMemo(() => createMarkdownComponents(highlights, mode), [highlights, mode]);

  return (
    <Markdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} skipHtml components={components}>
      {markdown}
    </Markdown>
  );
}

function createMarkdownComponents(highlights: MarkdownPreviewHighlight[], mode: RenderMode): Components {
  const isClipboard = mode === "clipboard";
  const sourceProps = (node?: MarkdownNode) => getSourceAttributes(node);

  function sourceComponent(tagName: keyof JSX.IntrinsicElements, className?: string, extraProps?: Record<string, unknown>) {
    return function Component(props: any) {
      const { node, children, className: incomingClassName, ...rest } = props;
      return createElement(
        tagName,
        {
          ...rest,
          ...sourceProps(node),
          ...extraProps,
          className: joinClassNames(className, incomingClassName)
        },
        children
      );
    };
  }

  function blockComponent(tagName: keyof JSX.IntrinsicElements, className?: string, style?: CSSProperties) {
    return function Component(props: any) {
      const { node, children, className: incomingClassName, ...rest } = props;
      return createElement(
        tagName,
        {
          ...rest,
          ...sourceProps(node),
          className: joinClassNames(className, incomingClassName),
          style: isClipboard ? style : undefined
        },
        children
      );
    };
  }

  const components: Components = {
    p: blockComponent(
      "p",
      "markdown-preview__paragraph",
      isClipboard
        ? {
            margin: "0 0 1em",
            fontSize: "0.98rem",
            lineHeight: 1.75,
            color: "#303743"
          }
        : undefined
    ),
    h1: blockComponent(
      "h1",
      "markdown-preview__heading markdown-preview__heading--1",
      isClipboard
        ? {
            margin: "0 0 0.8em",
            color: "#202631",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontSize: "2.2rem"
          }
        : undefined
    ),
    h2: blockComponent(
      "h2",
      "markdown-preview__heading markdown-preview__heading--2",
      isClipboard
        ? {
            margin: "0 0 0.8em",
            color: "#202631",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontSize: "1.75rem"
          }
        : undefined
    ),
    h3: blockComponent(
      "h3",
      "markdown-preview__heading markdown-preview__heading--3",
      isClipboard
        ? {
            margin: "0 0 0.8em",
            color: "#202631",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontSize: "1.42rem"
          }
        : undefined
    ),
    h4: blockComponent(
      "h4",
      "markdown-preview__heading markdown-preview__heading--4",
      isClipboard
        ? {
            margin: "0 0 0.8em",
            color: "#202631",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontSize: "1.2rem"
          }
        : undefined
    ),
    h5: blockComponent(
      "h5",
      "markdown-preview__heading markdown-preview__heading--5",
      isClipboard
        ? {
            margin: "0 0 0.8em",
            color: "#202631",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontSize: "1.05rem"
          }
        : undefined
    ),
    h6: blockComponent(
      "h6",
      "markdown-preview__heading markdown-preview__heading--6",
      isClipboard
        ? {
            margin: "0 0 0.8em",
            color: "#4f5763",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: "0.92rem"
          }
        : undefined
    ),
    blockquote: blockComponent(
      "blockquote",
      "markdown-preview__blockquote",
      isClipboard
        ? {
            margin: "0 0 1em",
            padding: "0.85em 1.1em",
            borderLeft: "4px solid #007acc",
            background: "#f6f9fc",
            color: "#4e5967"
          }
        : undefined
    ),
    ol: blockComponent(
      "ol",
      "markdown-preview__list",
      isClipboard ? { margin: "0 0 1em 1.35em", padding: 0, color: "#303743" } : undefined
    ),
    ul: blockComponent(
      "ul",
      "markdown-preview__list",
      isClipboard ? { margin: "0 0 1em 1.35em", padding: 0, color: "#303743" } : undefined
    ),
    li: blockComponent(
      "li",
      "",
      isClipboard ? { margin: "0.35em 0", paddingLeft: "0.2em", lineHeight: 1.7 } : undefined
    ),
    a: function LinkComponent(props: any) {
      const { node, children, className: incomingClassName, ...rest } = props;
      return (
        <a
          {...rest}
          {...sourceProps(node)}
          className={joinClassNames("markdown-preview__link", incomingClassName)}
          style={
            isClipboard
              ? {
                  color: "#0b73b9",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(0, 122, 204, 0.22)"
                }
              : undefined
          }
        >
          {children}
        </a>
      );
    },
    img: function ImageComponent(props: any) {
      const { node, className: incomingClassName, ...rest } = props;
      return (
        <img
          {...rest}
          {...sourceProps(node)}
          className={joinClassNames("markdown-preview__image", incomingClassName)}
          style={isClipboard ? { maxWidth: "100%", height: "auto" } : undefined}
        />
      );
    },
    strong: sourceComponent("strong"),
    em: sourceComponent("em"),
    del: sourceComponent("del"),
    br: sourceComponent("br"),
    hr: blockComponent(
      "hr",
      "markdown-preview__rule",
      isClipboard ? { margin: "1.35em 0", border: 0, borderTop: "1px solid #dde2ea" } : undefined
    ),
    pre: function PreComponent(props: any) {
      const { node, children, className: incomingClassName, ...rest } = props;
      const codeNode = Array.isArray(node?.children) ? node.children.find((child: any) => child?.tagName === "code") : null;
      const codeClassName = normalizeClassName(codeNode?.properties?.className);
      const language = codeClassName.match(/language-([a-z0-9_-]+)/i)?.[1] ?? "";

      return (
        <figure
          {...rest}
          {...sourceProps(node)}
          className={joinClassNames("markdown-preview__codeblock", incomingClassName)}
          style={
            isClipboard
              ? {
                  margin: "0 0 1em"
                }
              : undefined
          }
        >
          {language ? (
            <figcaption
              className="markdown-preview__code-language"
              style={
                isClipboard
                  ? {
                      margin: "0 0 0.3rem",
                      color: "#7a808c",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase"
                    }
                  : undefined
              }
            >
              {language}
            </figcaption>
          ) : null}
          <pre
            className="markdown-preview__code"
            style={
              isClipboard
                ? {
                    margin: 0,
                    padding: "16px 18px",
                    overflow: "auto",
                    background: "#f3f5f8",
                    border: "1px solid #dde2ea",
                    color: "#2f3441",
                    fontFamily: '"Cascadia Code","SFMono-Regular",Consolas,"Liberation Mono",monospace',
                    fontSize: "0.92rem",
                    lineHeight: 1.7
                  }
                : undefined
            }
          >
            {children}
          </pre>
        </figure>
      );
    },
    code: function CodeComponent(props: any) {
      const { node, children, className: incomingClassName, ...rest } = props;
      const className = normalizeClassName(incomingClassName);
      const isBlock = /language-/.test(className);

      return (
        <code
          {...rest}
          {...sourceProps(node)}
          className={joinClassNames(isBlock ? className : "markdown-preview__inline-code", undefined)}
          style={
            isClipboard && !isBlock
              ? {
                  padding: "0.14em 0.35em",
                  border: "1px solid #dde2ea",
                  background: "#f3f5f8",
                  color: "#2f3441",
                  fontFamily: '"Cascadia Code","SFMono-Regular",Consolas,"Liberation Mono",monospace',
                  fontSize: "0.92em",
                  borderRadius: "3px"
                }
              : isClipboard && isBlock
                ? {
                    font: "inherit"
                  }
                : undefined
          }
        >
          {children}
        </code>
      );
    },
    table: blockComponent(
      "table",
      "markdown-preview__table",
      isClipboard
        ? {
            width: "100%",
            borderCollapse: "collapse",
            margin: "0 0 1em",
            color: "#303743"
          }
        : undefined
    ),
    thead: blockComponent("thead", "", isClipboard ? undefined : undefined),
    tbody: blockComponent("tbody", "", isClipboard ? undefined : undefined),
    tr: blockComponent("tr", "", isClipboard ? undefined : undefined),
    th: function TableHeaderComponent(props: any) {
      const { node, children, align, ...rest } = props;
      return (
        <th
          {...rest}
          {...sourceProps(node)}
          style={
            isClipboard
              ? {
                  textAlign: align ?? "left",
                  padding: "0.5rem 0.7rem",
                  border: "1px solid #dde2ea",
                  verticalAlign: "top",
                  background: "#f6f9fc"
                }
              : { textAlign: align ?? "left" }
          }
        >
          {children}
        </th>
      );
    },
    td: function TableCellComponent(props: any) {
      const { node, children, align, ...rest } = props;
      return (
        <td
          {...rest}
          {...sourceProps(node)}
          style={
            isClipboard
              ? {
                  textAlign: align ?? "left",
                  padding: "0.5rem 0.7rem",
                  border: "1px solid #dde2ea",
                  verticalAlign: "top"
                }
              : { textAlign: align ?? "left" }
          }
        >
          {children}
        </td>
      );
    },
    input: function TaskCheckboxComponent(props: any) {
      const { node, checked, ...rest } = props;
      return (
        <input
          {...rest}
          {...sourceProps(node)}
          type="checkbox"
          checked={checked}
          readOnly
          disabled
          className="markdown-preview__task-checkbox"
          style={
            isClipboard
              ? {
                  marginRight: "0.5rem",
                  verticalAlign: "middle"
                }
              : undefined
          }
        />
      );
    },
    span: function TextSpanComponent(props: any) {
      const { node, children, className: incomingClassName, ...rest } = props;
      const textKind = getTextKind(node);

      if (textKind !== "text") {
        return (
          <span {...rest} {...sourceProps(node)} className={incomingClassName}>
            {children}
          </span>
        );
      }

      const range = getNodeRange(node);
      if (!range) {
        return (
          <span {...rest} {...sourceProps(node)} className={incomingClassName}>
            {children}
          </span>
        );
      }

      const text = String(children ?? "");
      const fragments = splitTextByHighlights(text, range.start, range.end, highlights);

      return (
        <>
          {fragments.map((fragment, index) => {
            const key = `${range.start}-${range.end}-${index}`;

            if (fragment.highlighted) {
              return (
                <mark
                  key={key}
                  className="markdown-preview__highlight"
                  data-source-start={fragment.sourceStart}
                  data-source-end={fragment.sourceEnd}
                >
                  {fragment.text}
                </mark>
              );
            }

            return (
              <span
                key={key}
                {...rest}
                data-source-start={fragment.sourceStart}
                data-source-end={fragment.sourceEnd}
                className={incomingClassName}
              >
                {fragment.text}
              </span>
            );
          })}
        </>
      );
    }
  };

  return components;
}

function splitTextByHighlights(
  text: string,
  sourceStart: number,
  sourceEnd: number,
  highlights: MarkdownPreviewHighlight[]
): HighlightFragment[] {
  const overlapping = highlights
    .filter((highlight) => highlight.startOffset < sourceEnd && highlight.endOffset > sourceStart)
    .sort((left, right) => left.startOffset - right.startOffset || left.endOffset - right.endOffset);

  if (overlapping.length === 0) {
    return [{ text, sourceStart, sourceEnd, highlighted: false }];
  }

  const boundaries = new Set<number>([sourceStart, sourceEnd]);

  for (const highlight of overlapping) {
    boundaries.add(clamp(highlight.startOffset, sourceStart, sourceEnd));
    boundaries.add(clamp(highlight.endOffset, sourceStart, sourceEnd));
  }

  const ordered = [...boundaries].sort((left, right) => left - right);
  const pieces: HighlightFragment[] = [];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const pieceStart = ordered[index];
    const pieceEnd = ordered[index + 1];

    if (pieceEnd <= pieceStart) {
      continue;
    }

    const pieceText = text.slice(pieceStart - sourceStart, pieceEnd - sourceStart);
    const highlighted = overlapping.some((highlight) => highlight.startOffset <= pieceStart && highlight.endOffset >= pieceEnd);

    if (pieceText.length > 0) {
      pieces.push({
        text: pieceText,
        sourceStart: pieceStart,
        sourceEnd: pieceEnd,
        highlighted
      });
    }
  }

  return pieces.length > 0 ? pieces : [{ text, sourceStart, sourceEnd, highlighted: false }];
}

function rehypeWrapTextNodes() {
  return (tree: MarkdownNode) => {
    wrapTextNodes(tree);
  };
}

function wrapTextNodes(node: MarkdownNode) {
  if (!node.children || node.children.length === 0) {
    return;
  }

  const nextChildren: MarkdownNode[] = [];

  for (const child of node.children) {
    if (child.type === "text") {
      const text = typeof child.value === "string" ? child.value : "";

      if (text.length === 0) {
        continue;
      }

      if (shouldSkipWhitespaceTextNode(node, text)) {
        continue;
      }

      const start = child.position?.start?.offset ?? 0;
      const end = child.position?.end?.offset ?? start + text.length;

      nextChildren.push({
        type: "element",
        tagName: "span",
        properties: {
          "data-source-start": start,
          "data-source-end": end,
          "data-source-kind": "text"
        },
        position: child.position,
        children: [child]
      });
      continue;
    }

    wrapTextNodes(child);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

function shouldSkipWhitespaceTextNode(parent: MarkdownNode, text: string): boolean {
  return parent.tagName === "li" && text.trim().length === 0;
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

function getSourceAttributes(node?: MarkdownNode): Record<string, string | number> {
  const range = getNodeRange(node);

  if (range === null) {
    return {};
  }

  return {
    "data-source-start": range.start,
    "data-source-end": range.end
  };
}

function getNodeRange(node?: MarkdownNode): { start: number; end: number } | null {
  const positionStart = node?.position?.start?.offset;
  const positionEnd = node?.position?.end?.offset;

  if (typeof positionStart === "number" && typeof positionEnd === "number") {
    return { start: positionStart, end: positionEnd };
  }

  const propertyStart = getNumericProperty(node?.properties?.["data-source-start"]);
  const propertyEnd = getNumericProperty(node?.properties?.["data-source-end"]);

  if (typeof propertyStart === "number" && typeof propertyEnd === "number") {
    return { start: propertyStart, end: propertyEnd };
  }

  return null;
}

function getTextKind(node?: MarkdownNode): string | null {
  const value = node?.properties?.["data-source-kind"];

  return typeof value === "string" ? value : null;
}

function getNumericProperty(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeClassName(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string").join(" ");
  }

  return typeof value === "string" ? value : "";
}

function joinClassNames(...values: Array<string | undefined | null>): string | undefined {
  const filtered = values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return filtered.length > 0 ? filtered.join(" ") : undefined;
}

function normalizeExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
