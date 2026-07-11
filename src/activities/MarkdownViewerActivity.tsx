import { ActivityEditor } from "../ui/workspace/ActivityEditor";
import { ActivitySidebar } from "../ui/workspace/ActivitySidebar";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";
import { ActivityTree } from "../ui/workspace/ActivityTree";

const files = [
  { name: "notes.md", kind: "md", active: true },
  { name: "outline.md", kind: "md" },
  { name: "README.md", kind: "md" },
  { name: "draft.md", kind: "md" }
];

const editorLines = [
  { no: 1, code: "# Markdown Viewer" },
  { no: 2, code: "" },
  { no: 3, code: "Use this activity to preview and inspect markdown content." },
  { no: 4, code: "" },
  { no: 5, code: "- Flat, VS Code-style shell" },
  { no: 6, code: "- Persistent activity rail" },
  { no: 7, code: "- Persistent status bar" },
  { no: 8, code: "" },
  { no: 9, code: "This view is the starting point for the first real activity." }
];

const explorerItems = [
  { name: "docs", type: "folder", open: true },
  { name: "notes", type: "folder" },
  { name: "markdown", type: "folder" },
  { name: "notes.md", type: "file", active: true },
  { name: "outline.md", type: "file" },
  { name: "draft.md", type: "file" }
];

export function MarkdownViewerActivity() {
  return (
    <>
      <ActivitySidebar title="MARKDOWN VIEWER">
        <ActivityTree items={explorerItems} />
      </ActivitySidebar>

      <main className="editor-shell">
        <ActivityTabs files={files} />

        <section className="editor-panel editor-panel--compact">
          <ActivityEditor label="Markdown viewer" lines={editorLines} />
        </section>
      </main>
    </>
  );
}
