import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

type ActivityEditorProps = {
  label: string;
  initialValue: string;
  value?: string;
  mode?: "plain" | "json" | "javascript";
  onChange?: (value: string) => void;
  onRunShortcut?: () => void;
  inspector?: ReactNode;
};

export function ActivityEditor({
  label,
  initialValue,
  value,
  mode = "plain",
  onChange,
  onRunShortcut,
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
    const nextExtensions = [];

    if (mode === "json") {
      nextExtensions.push(json());
    }

    if (mode === "javascript") {
      nextExtensions.push(javascript({ jsx: true }));
    }

    if (onRunShortcut) {
      nextExtensions.push(
        EditorView.domEventHandlers({
          keydown(event) {
            if (event.isComposing) {
              return false;
            }

            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onRunShortcut();
              return true;
            }

            return false;
          }
        })
      );
    }

    return nextExtensions;
  }, [mode, onRunShortcut]);

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
