import type { ReactNode } from "react";

export type WorkspaceFileItem = {
  name: string;
  kind: "tsx" | "css" | "md" | "json";
  active?: boolean;
};

export type WorkspaceTreeItem = {
  name: string;
  type: "folder" | "file";
  active?: boolean;
};

export type WorkspaceLineItem = {
  no: number;
  code: string;
};

type ActivityWorkspaceProps = {
  sidebarTitle: string;
  sidebarActionLabel?: string;
  treeHeader?: string;
  treeCount?: string | number;
  treeItems: WorkspaceTreeItem[];
  files: WorkspaceFileItem[];
  editorLabel: string;
  editorLines: WorkspaceLineItem[];
  breadcrumbs?: string[];
  inspector?: ReactNode;
};

export function ActivityWorkspace({
  sidebarTitle,
  sidebarActionLabel = "More actions",
  treeHeader,
  treeCount,
  treeItems,
  files,
  editorLabel,
  editorLines,
  breadcrumbs,
  inspector
}: ActivityWorkspaceProps) {
  return (
    <>
      <aside className="sidebar">
        <div className="panel-titlebar">
          <span>{sidebarTitle}</span>
          <button type="button" className="icon-mini" aria-label={sidebarActionLabel}>
            …
          </button>
        </div>

        <section className="sidebar-section sidebar-section--tree">
          {treeHeader ? (
            <div className="sidebar-section__header">
              <span>{treeHeader}</span>
              {treeCount !== undefined ? <span className="sidebar-section__count">{treeCount}</span> : null}
            </div>
          ) : null}

          <div className="tree">
            {treeItems.map((item) => (
              <div
                key={item.name}
                className={`tree__item tree__item--${item.type} ${
                  item.active ? "tree__item--active" : ""
                }`}
              >
                <span className="tree__glyph" aria-hidden="true">
                  {item.type === "folder" ? "▸" : "•"}
                </span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="editor-shell">
        <div className="tab-strip" role="tablist" aria-label="Open files">
          {files.map((file) => (
            <button
              key={file.name}
              type="button"
              className={`tab ${file.active ? "tab--active" : ""}`}
              role="tab"
              aria-selected={file.active}
            >
              <span className={`file-chip file-chip--${file.kind}`}>{file.kind.toUpperCase()}</span>
              <span>{file.name}</span>
              <span className="tab__close" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>

        <section className={`editor-panel ${breadcrumbs?.length ? "" : "editor-panel--compact"}`}>
          {breadcrumbs?.length ? (
            <div className="editor-panel__breadcrumbs">
              {breadcrumbs.map((crumb) => (
                <span key={crumb}>{crumb}</span>
              ))}
            </div>
          ) : null}

          <div className={`editor ${inspector ? "editor--with-inspector" : "editor--compact"}`}>
            <div className="gutter" aria-hidden="true">
              {editorLines.map((line) => (
                <div key={line.no} className="gutter__line">
                  {line.no}
                </div>
              ))}
            </div>

            <pre className="code" aria-label={editorLabel}>
              {editorLines.map((line) => (
                <code key={line.no} className="code__line">
                  {line.code || "\u00A0"}
                </code>
              ))}
            </pre>

            {inspector ? <aside className="editor-hint">{inspector}</aside> : null}
          </div>
        </section>
      </main>
    </>
  );
}
