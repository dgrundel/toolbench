import { useEffect, useRef, useState } from "react";
import { ActivityEditor } from "../ui/workspace/ActivityEditor";
import { ActivityToolbar } from "../ui/workspace/ActivityToolbar";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";
import { WorkspaceIcon } from "../ui/workspace/WorkspaceIcon";
import { JsonValueInspector } from "../ui/workspace/JsonValueInspector";
import { runJsonBenchTransform } from "./jsonBenchRuntime";

const jsonSource = [
  "{",
  '  "title": "Example document",',
  '  "active": true,',
  '  "count": 2,',
  '  "items": [',
  '    "alpha",',
  '    "beta"',
  "  ]",
  "}"
].join("\n");

const jsonTabs = [{ name: "input.json", kind: "json", active: true }];

const javascriptSource = [
  "export default async function transform(input) {",
  "  return input;",
  "}"
].join("\n");

const javascriptTabs = [{ name: "transform.js", kind: "js", active: true }];

export function JSONBenchActivity() {
  const [inputJson, setInputJson] = useState(jsonSource);
  const [transformSource, setTransformSource] = useState(javascriptSource);
  const [executionState, setExecutionState] = useState<ExecutionState>({ kind: "idle" });
  const [copyButtonLabel, setCopyButtonLabel] = useState("Copy JSON");
  const resetCopyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetCopyTimer.current !== null) {
        window.clearTimeout(resetCopyTimer.current);
      }
    };
  }, []);

  async function handleRun() {
    setExecutionState({ kind: "idle" });
    setCopyButtonLabel("Copy JSON");

    try {
      const result = await runJsonBenchTransform(transformSource, inputJson);
      console.log(result);
      setExecutionState({ kind: "success", value: result });
    } catch (error) {
      setExecutionState({ kind: "error", message: formatExecutionError(error) });
    }
  }

  async function handleCopyResult() {
    if (executionState.kind !== "success") {
      return;
    }

    await navigator.clipboard.writeText(JSON.stringify(executionState.value, null, 2));
    setCopyButtonLabel("Copied JSON");

    if (resetCopyTimer.current !== null) {
      window.clearTimeout(resetCopyTimer.current);
    }

    resetCopyTimer.current = window.setTimeout(() => {
      setCopyButtonLabel("Copy JSON");
      resetCopyTimer.current = null;
    }, 1500);
  }

  return (
    <main className="json-bench-workspace">
      <section className="json-bench-workspace__top">
        <div className="json-bench-workspace__panel json-bench-workspace__panel--left">
          <ActivityTabs files={jsonTabs} />
          <ActivityEditor
            label="JSON bench JSON editor"
            initialValue={jsonSource}
            value={inputJson}
            mode="json"
            onChange={setInputJson}
          />
        </div>

        <div className="json-bench-workspace__panel json-bench-workspace__panel--right">
          <ActivityTabs files={javascriptTabs} />
          <ActivityEditor
            label="JSON bench JavaScript editor"
            initialValue={javascriptSource}
            value={transformSource}
            onChange={setTransformSource}
            mode="javascript"
          />
        </div>
      </section>

      <section className="json-bench-workspace__panel json-bench-workspace__panel--bottom" aria-label="Bottom panel">
        <ActivityTabs files={[{ name: "output.json", kind: "json", active: true }]} />
        <ActivityToolbar label="Output actions">
          <button
            className="editor-panel__toolbar-button"
            type="button"
            onClick={handleRun}
          >
            <WorkspaceIcon name="player-play" size={14} className="editor-panel__toolbar-button-icon" />
            Run
          </button>
          <button
            className="editor-panel__toolbar-button"
            type="button"
            onClick={() => {
              void handleCopyResult();
            }}
            disabled={executionState.kind !== "success"}
          >
            <WorkspaceIcon name="copy" size={14} className="editor-panel__toolbar-button-icon" />
            {copyButtonLabel}
          </button>
        </ActivityToolbar>
        <div className="json-bench-workspace__bottom" aria-label="JSON output preview">
          {executionState.kind === "error" ? (
            <div className="json-bench-workspace__error" role="alert" aria-live="assertive">
              <div className="json-bench-workspace__error-header">
                <WorkspaceIcon name="alert-triangle" size={16} className="json-bench-workspace__error-icon" />
                <span className="json-bench-workspace__error-title">Execution failed</span>
              </div>
              <div className="json-bench-workspace__error-message">{executionState.message}</div>
            </div>
          ) : executionState.kind === "success" ? (
            <div className="json-bench-workspace__result">
              <JsonValueInspector value={executionState.value} />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

type ExecutionState =
  | { kind: "idle" }
  | { kind: "success"; value: unknown }
  | { kind: "error"; message: string };

function formatExecutionError(error: unknown) {
  if (error instanceof SyntaxError) {
    return `Input JSON parse error: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message || "Execution error";
  }

  return String(error);
}
