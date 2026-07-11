import type { ReactNode } from "react";

type ActivityEditorProps = {
  label: string;
  lines: string[];
  inspector?: ReactNode;
};

export function ActivityEditor({ label, lines, inspector }: ActivityEditorProps) {
  return (
    <div className={`editor ${inspector ? "editor--with-inspector" : "editor--compact"}`}>
      <div className="gutter" aria-hidden="true">
        {lines.map((_, index) => (
          <div key={index} className="gutter__line">
            {index + 1}
          </div>
        ))}
      </div>

      <div className="editor__content">
        <pre className="code" aria-label={label}>
          {lines.map((line, index) => (
            <code key={index} className="code__line">
              {line || "\u00A0"}
            </code>
          ))}
        </pre>
      </div>

      {inspector ? <aside className="editor-hint">{inspector}</aside> : null}
    </div>
  );
}
