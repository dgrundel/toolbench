import type { ReactNode } from "react";
import type { WorkspaceLineItem } from "./types";

type ActivityEditorProps = {
  label: string;
  lines: WorkspaceLineItem[];
  inspector?: ReactNode;
};

export function ActivityEditor({ label, lines, inspector }: ActivityEditorProps) {
  return (
    <div className={`editor ${inspector ? "editor--with-inspector" : "editor--compact"}`}>
      <div className="gutter" aria-hidden="true">
        {lines.map((line) => (
          <div key={line.no} className="gutter__line">
            {line.no}
          </div>
        ))}
      </div>

      <pre className="code" aria-label={label}>
        {lines.map((line) => (
          <code key={line.no} className="code__line">
            {line.code || "\u00A0"}
          </code>
        ))}
      </pre>

      {inspector ? <aside className="editor-hint">{inspector}</aside> : null}
    </div>
  );
}
