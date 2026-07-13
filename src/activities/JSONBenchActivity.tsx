import { ActivityEditor } from "../ui/workspace/ActivityEditor";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";

const jsonSource = [
  "{",
  '  "name": "JSON Bench",',
  '  "version": 1,',
  '  "settings": {',
  '    "theme": "vscode-light",',
  '    "wrap": false,',
  '    "lint": true',
  "  },",
  '  "items": [',
  '    { "id": 1, "label": "Example" },',
  '    { "id": 2, "label": "Scratch" }',
  "  ]",
  "}"
].join("\n");

const jsonTabs = [{ name: "input.json", kind: "json", active: true }];

const javascriptSource = [
  "const settings = {",
  '  theme: "vscode-light",',
  "  wrap: false,",
  "  lint: true",
  "};",
  "",
  "export function createBenchState() {",
  "  return {",
  "    ready: true,",
  "    documents: []",
  "  };",
  "}"
].join("\n");

const javascriptTabs = [{ name: "transform.js", kind: "js", active: true }];

export function JSONBenchActivity() {
  return (
    <main className="json-bench-workspace">
      <section className="json-bench-workspace__top">
        <div className="json-bench-workspace__panel json-bench-workspace__panel--left">
          <ActivityTabs files={jsonTabs} />
          <ActivityEditor label="JSON bench JSON editor" initialValue={jsonSource} mode="json" />
        </div>

        <div className="json-bench-workspace__panel json-bench-workspace__panel--right">
          <ActivityTabs files={javascriptTabs} />
          <ActivityEditor
            label="JSON bench JavaScript editor"
            initialValue={javascriptSource}
            mode="javascript"
          />
        </div>
      </section>

      <section className="json-bench-workspace__panel json-bench-workspace__panel--bottom" aria-label="Bottom panel">
        <ActivityTabs files={[{ name: "output.json", kind: "json", active: true }]} />
        <div className="json-bench-workspace__bottom" />
      </section>
    </main>
  );
}
