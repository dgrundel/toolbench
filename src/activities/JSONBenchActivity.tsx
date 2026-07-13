import { ActivityBreadcrumbs } from "../ui/workspace/ActivityBreadcrumbs";
import { ActivityEditor } from "../ui/workspace/ActivityEditor";
import { ActivityInspectorCard } from "../ui/workspace/ActivityInspectorCard";
import { ActivitySidebar } from "../ui/workspace/ActivitySidebar";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";
import { ActivityTree } from "../ui/workspace/ActivityTree";

const files = [
  { name: "app.tsx", kind: "tsx", active: true },
  { name: "theme.css", kind: "css" },
  { name: "README.md", kind: "md" },
  { name: "data.json", kind: "json" }
];

const editorLines = [
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
];

const explorerItems = [
  { name: "src", type: "folder", open: true },
  { name: "components", type: "folder" },
  { name: "styles", type: "folder" },
  { name: "app.tsx", type: "file", active: true },
  { name: "theme.css", type: "file" },
  { name: "index.tsx", type: "file" }
];

const editorValue = editorLines.join("\n");

export function JSONBenchActivity() {
  return (
    <>
      <ActivitySidebar title="JSON BENCH">
        <ActivityTree items={explorerItems} header="PROJECT" count={4} />
      </ActivitySidebar>

      <main className="editor-shell">
        <ActivityTabs files={files} />

        <section className="editor-panel">
          <ActivityBreadcrumbs crumbs={["src", "/", "app.tsx", "/", "Workspace"]} />
          <ActivityEditor
            label="JSON bench editor"
            initialValue={editorValue}
            mode="json"
            inspector={
              <ActivityInspectorCard
                eyebrow="JSON bench"
                title="Neutral panels, blue emphasis, square geometry."
                body="This activity starts as a copy of the Demo shell so it can become a JSON-focused workspace without reworking the surrounding layout."
              />
            }
          />
        </section>
      </main>
    </>
  );
}
