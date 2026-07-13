import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

type ActivityEditorProps = {
  label: string;
  initialValue: string;
  value?: string;
  mode?: "plain" | "json" | "javascript";
  onChange?: (value: string) => void;
  inspector?: ReactNode;
};

export function ActivityEditor({
  label,
  initialValue,
  value,
  mode = "plain",
  onChange,
  inspector
}: ActivityEditorProps) {
  const [internalValue, setInternalValue] = useState(initialValue);

  useEffect(() => {
    if (value === undefined) {
      setInternalValue(initialValue);
    }
  }, [initialValue, value]);

  const editorValue = value ?? internalValue;

  const extensions = useMemo(() => {
    if (mode === "json") {
      return [json()];
    }

    if (mode === "javascript") {
      return [javascript({ jsx: true })];
    }

    return [];
  }, [mode]);

  const handleChange = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return (
    <div className={`editor ${inspector ? "editor--with-inspector" : "editor--compact"}`}>
      <div className="editor__content">
        <div className="editor__surface">
          <CodeMirror
            value={editorValue}
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
