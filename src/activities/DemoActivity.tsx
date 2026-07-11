import { ActivityWorkspace } from "../ui/ActivityWorkspace";

const files = [
  { name: "app.tsx", kind: "tsx", active: true },
  { name: "theme.css", kind: "css" },
  { name: "README.md", kind: "md" },
  { name: "data.json", kind: "json" }
];

const editorLines = [
  { no: 1, code: "import { Panel } from './ui/Panel';" },
  { no: 2, code: "import { Sidebar } from './ui/Sidebar';" },
  { no: 3, code: "" },
  { no: 4, code: "export default function AppShell() {" },
  { no: 5, code: "  return (" },
  { no: 6, code: "    <Workspace" },
  { no: 7, code: "      tone=\"light\"" },
  { no: 8, code: "      density=\"compact\"" },
  { no: 9, code: "    />" },
  { no: 10, code: "  );" },
  { no: 11, code: "}" }
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
    <ActivityWorkspace
      sidebarTitle="DEMO"
      treeHeader="PROJECT"
      treeCount={4}
      treeItems={explorerItems}
      files={files}
      editorLabel="Example editor"
      editorLines={editorLines}
      breadcrumbs={["src", "/", "app.tsx", "/", "Workspace"]}
      inspector={
        <div className="editor-hint__card">
          <p className="editor-hint__eyebrow">Light theme</p>
          <h1>Neutral panels, blue emphasis, square geometry.</h1>
          <p>
            This rebuild leans on the VS Code desktop language: slim borders, subdued chrome,
            tabbed editing, and a soft accent line instead of heavy shadows.
          </p>
        </div>
      }
    />
  );
}
