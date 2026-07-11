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
  "import { Panel } from './ui/Panel';",
  "import { Sidebar } from './ui/Sidebar';",
  "",
  "export default function AppShell() {",
  "  return (",
  "    <Workspace",
  "      tone=\"light\"",
  "      density=\"compact\"",
  "    />",
  "  );",
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

export function DemoActivity() {
  return (
    <>
      <ActivitySidebar title="DEMO">
        <ActivityTree items={explorerItems} header="PROJECT" count={4} />
      </ActivitySidebar>

      <main className="editor-shell">
        <ActivityTabs files={files} />

        <section className="editor-panel">
          <ActivityBreadcrumbs crumbs={["src", "/", "app.tsx", "/", "Workspace"]} />
          <ActivityEditor
            label="Example editor"
            lines={editorLines}
            inspector={
              <ActivityInspectorCard
                eyebrow="Light theme"
                title="Neutral panels, blue emphasis, square geometry."
                body="This rebuild leans on the VS Code desktop language: slim borders, subdued chrome, tabbed editing, and a soft accent line instead of heavy shadows."
              />
            }
          />
        </section>
      </main>
    </>
  );
}
