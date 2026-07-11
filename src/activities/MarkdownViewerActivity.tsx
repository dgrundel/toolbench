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
  "# Markdown Viewer",
  "",
  "Use this activity to preview and inspect markdown content.",
  "",
  "- Flat, VS Code-style shell",
  "- Persistent activity rail",
  "- Persistent status bar",
  "",
  "This view is the starting point for the first real activity."
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
