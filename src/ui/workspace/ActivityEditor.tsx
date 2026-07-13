import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import { json } from "@codemirror/lang-json";

type ActivityEditorProps = {
  label: string;
  initialValue: string;
  mode?: "plain" | "json";
  onChange?: (value: string) => void;
  inspector?: ReactNode;
};

export function ActivityEditor({
  label,
  initialValue,
  mode = "plain",
  onChange,
  inspector
}: ActivityEditorProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const extensions = useMemo(() => {
    return mode === "json" ? [json()] : [];
  }, [mode]);

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    onChange?.(nextValue);
  };

  return (
    <div className={`editor ${inspector ? "editor--with-inspector" : "editor--compact"}`}>
      <div className="editor__content">
        <div className="editor__surface">
          <CodeMirror
            value={value}
            height="100%"
            basicSetup
            theme={vscodeLight}
            extensions={extensions}
            aria-label={label}
            onChange={handleChange}
          />
        </div>
      </div>

      {inspector ? <aside className="editor-hint">{inspector}</aside> : null}
    </div>
  );
}
