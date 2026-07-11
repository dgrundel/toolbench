import { useState, type DragEvent } from "react";
import { ActivityEditor } from "../ui/workspace/ActivityEditor";
import { ActivitySidebar } from "../ui/workspace/ActivitySidebar";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";
import { ActivityTree } from "../ui/workspace/ActivityTree";

type MarkdownDocument = {
  id: string;
  name: string;
  content: string;
};

const initialDocuments: MarkdownDocument[] = [
  {
    id: "notes",
    name: "notes.md",
    content: [
      "# Markdown Viewer",
      "",
      "Use this activity to preview and inspect markdown content.",
      "",
      "- Flat, VS Code-style shell",
      "- Persistent activity rail",
      "- Persistent status bar",
      "",
      "This view is the starting point for the first real activity."
    ].join("\n")
  },
  {
    id: "outline",
    name: "outline.md",
    content: [
      "# Outline",
      "",
      "1. Import a markdown file.",
      "2. Click it in the file list or tabs.",
      "3. Read the content in the editor."
    ].join("\n")
  },
  {
    id: "readme",
    name: "README.md",
    content: [
      "# README",
      "",
      "This is a markdown viewer prototype.",
      "",
      "- Switch between files from the left panel",
      "- Switch between files from the tabs",
      "- Keep the current document in view"
    ].join("\n")
  },
  {
    id: "draft",
    name: "draft.md",
    content: [
      "# Draft",
      "",
      "The editor content changes when you click a different file.",
      "",
      "That state is shared by the file list, the tab strip, and the editor."
    ].join("\n")
  }
];

export function MarkdownViewerActivity() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(initialDocuments[0].id);
  const [openDocumentIds, setOpenDocumentIds] = useState(initialDocuments.map((document) => document.id));
  const [dropTarget, setDropTarget] = useState<"sidebar" | "editor" | null>(null);

  const openDocuments = openDocumentIds
    .map((documentId) => documents.find((document) => document.id === documentId))
    .filter((document): document is MarkdownDocument => Boolean(document));
  const activeDocument = openDocuments.find((document) => document.id === activeDocumentId) ?? openDocuments[0] ?? null;
  const files = openDocuments.map((document) => ({
    name: document.name,
    kind: "md" as const,
    active: document.id === activeDocumentId
  }));
  const explorerItems = documents.map((document) => ({
    name: document.name,
    type: "file" as const,
    active: document.id === activeDocument?.id
  }));
  const editorLines = activeDocument?.content.split(/\r?\n/) ?? [];

  function selectDocument(name: string) {
    const selected = documents.find((document) => document.name === name);

    if (selected) {
      setActiveDocumentId(selected.id);
      setOpenDocumentIds((currentOpenDocumentIds) =>
        currentOpenDocumentIds.includes(selected.id)
          ? currentOpenDocumentIds
          : [...currentOpenDocumentIds, selected.id]
      );
    }
  }

  function closeDocument(name: string) {
    const selected = documents.find((document) => document.name === name);

    if (!selected) {
      return;
    }

    setOpenDocumentIds((currentOpenDocumentIds) => {
      const nextOpenDocumentIds = currentOpenDocumentIds.filter((documentId) => documentId !== selected.id);

      if (activeDocumentId === selected.id) {
        const nextActiveDocumentId = nextOpenDocumentIds[0] ?? null;
        setActiveDocumentId(nextActiveDocumentId);
      }

      return nextOpenDocumentIds;
    });
  }

  async function ingestFiles(fileList: FileList | File[]) {
    const droppedFiles = Array.from(fileList);

    if (droppedFiles.length === 0) {
      return;
    }

    const existingNames = new Set(documents.map((document) => document.name));
    const importedDocuments: MarkdownDocument[] = [];

    for (const file of droppedFiles) {
      const name = uniqueDocumentName(existingNames, file.name || "untitled.md");
      existingNames.add(name);
      importedDocuments.push({
        id: crypto.randomUUID(),
        name,
        content: await file.text()
      });
    }

    setDocuments((currentDocuments) => [...currentDocuments, ...importedDocuments]);
    setOpenDocumentIds((currentOpenDocumentIds) => [
      ...currentOpenDocumentIds,
      ...importedDocuments.map((document) => document.id)
    ]);
    setActiveDocumentId(importedDocuments[importedDocuments.length - 1].id);
  }

  function handleDragEnter(target: "sidebar" | "editor") {
    return (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDropTarget(target);
    };
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setDropTarget(null);
  }

  function handleDrop() {
    return async (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDropTarget(null);
      await ingestFiles(event.dataTransfer.files);
    };
  }

  return (
    <>
      <div
        className={`markdown-viewer__dropzone markdown-viewer__dropzone--sidebar ${
          dropTarget === "sidebar" ? "markdown-viewer__dropzone--active" : ""
        }`}
        onDragEnter={handleDragEnter("sidebar")}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop()}
      >
        <ActivitySidebar title="MARKDOWN VIEWER">
          <ActivityTree items={explorerItems} onSelect={(item) => selectDocument(item.name)} />
        </ActivitySidebar>
      </div>

      <main
        className={`editor-shell markdown-viewer__dropzone markdown-viewer__dropzone--editor ${
          dropTarget === "editor" ? "markdown-viewer__dropzone--active" : ""
        }`}
        onDragEnter={handleDragEnter("editor")}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop()}
      >
        <ActivityTabs
          files={files}
          onSelect={(file) => selectDocument(file.name)}
          onClose={(file) => closeDocument(file.name)}
        />

        <section className="editor-panel editor-panel--compact">
          {activeDocument ? (
            <ActivityEditor label={activeDocument.name} lines={editorLines} />
          ) : (
            <div className="editor-empty-state" aria-label="No file open">
              <p className="editor-empty-state__message">Open a file from the left or drag and drop one here to get started.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function uniqueDocumentName(existingNames: Set<string>, baseName: string) {
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  const match = /^(.*?)(\.[^.]+)?$/.exec(baseName);
  const stem = match?.[1] ?? baseName;
  const extension = match?.[2] ?? "";
  let suffix = 2;

  while (existingNames.has(`${stem} (${suffix})${extension}`)) {
    suffix += 1;
  }

  return `${stem} (${suffix})${extension}`;
}
