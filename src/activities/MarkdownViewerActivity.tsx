import { useEffect, useRef, useState, type DragEvent } from "react";
import { ActivitySidebar } from "../ui/workspace/ActivitySidebar";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";
import { ActivityTree } from "../ui/workspace/ActivityTree";
import { MarkdownPreview } from "../ui/workspace/MarkdownPreview";
import {
  deleteMarkdownDocument,
  listMarkdownDocuments,
  loadMarkdownDocument,
  saveMarkdownDocument,
  type MarkdownLibraryDocument,
  type MarkdownLibrarySummary
} from "../storage/markdownLibrary";

type MarkdownViewerActivityProps = {
  onStorageChange?: () => void;
};

export function MarkdownViewerActivity({ onStorageChange }: MarkdownViewerActivityProps) {
  const [storedDocuments, setStoredDocuments] = useState<MarkdownLibrarySummary[]>([]);
  const [openDocuments, setOpenDocuments] = useState<MarkdownLibraryDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<"sidebar" | "editor" | null>(null);
  const openRequestIdRef = useRef(0);
  const openRequestDocumentIdRef = useRef<string | null>(null);
  const activeDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId;
  }, [activeDocumentId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const records = await listMarkdownDocuments();

        if (!cancelled) {
          setStoredDocuments(records);
        }
      } catch (error) {
        console.error("Failed to load markdown documents.", error);
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
      openRequestIdRef.current += 1;
    };
  }, []);

  const activeDocument = openDocuments.find((document) => document.id === activeDocumentId) ?? openDocuments[0] ?? null;
  const files = openDocuments.map((document) => ({
    id: document.id,
    name: document.name,
    kind: "md" as const,
    active: document.id === activeDocumentId
  }));
  const explorerItems = storedDocuments.map((document) => ({
    id: document.id,
    name: document.name,
    type: "file" as const,
    active: document.id === activeDocument?.id
  }));
  async function refreshStoredDocuments() {
    const records = await listMarkdownDocuments();
    setStoredDocuments(records);
  }

  async function openDocument(documentId: string) {
    try {
      const alreadyOpen = openDocuments.find((document) => document.id === documentId);

      if (alreadyOpen) {
        setActiveDocumentId(documentId);
        return;
      }

      const requestId = ++openRequestIdRef.current;
      openRequestDocumentIdRef.current = documentId;
      const loadedDocument = await loadMarkdownDocument(documentId);

      if (
        !loadedDocument ||
        requestId !== openRequestIdRef.current ||
        openRequestDocumentIdRef.current !== documentId
      ) {
        return;
      }

      setOpenDocuments((currentOpenDocuments) =>
        currentOpenDocuments.some((document) => document.id === loadedDocument.id)
          ? currentOpenDocuments
          : [...currentOpenDocuments, loadedDocument]
      );
      openRequestDocumentIdRef.current = null;
      setActiveDocumentId(loadedDocument.id);
    } catch (error) {
      console.error(`Failed to open markdown document ${documentId}.`, error);
    }
  }

  function closeDocument(documentId: string) {
    setOpenDocuments((currentOpenDocuments) => {
      const nextIndex = currentOpenDocuments.findIndex((document) => document.id === documentId);

      if (nextIndex === -1) {
        return currentOpenDocuments;
      }

      const nextOpenDocuments = currentOpenDocuments.filter((document) => document.id !== documentId);

      if (activeDocumentId === documentId) {
        const nextActiveDocument = nextOpenDocuments[nextIndex] ?? nextOpenDocuments[nextIndex - 1] ?? null;
        setActiveDocumentId(nextActiveDocument?.id ?? null);
      }

      return nextOpenDocuments;
    });
  }

  async function deleteDocument(documentId: string) {
    try {
      if (openRequestDocumentIdRef.current === documentId) {
        openRequestIdRef.current += 1;
        openRequestDocumentIdRef.current = null;
      }

      await deleteMarkdownDocument(documentId);

      setOpenDocuments((currentOpenDocuments) => {
        const nextIndex = currentOpenDocuments.findIndex((document) => document.id === documentId);

        if (nextIndex === -1) {
          return currentOpenDocuments;
        }

        const nextOpenDocuments = currentOpenDocuments.filter((document) => document.id !== documentId);

        if (activeDocumentIdRef.current === documentId) {
          const nextActiveDocument = nextOpenDocuments[nextIndex] ?? nextOpenDocuments[nextIndex - 1] ?? null;
          setActiveDocumentId(nextActiveDocument?.id ?? null);
        }

        return nextOpenDocuments;
      });

      await refreshStoredDocuments();
    } catch (error) {
      console.error(`Failed to delete markdown document ${documentId}.`, error);
    } finally {
      onStorageChange?.();
    }
  }

  async function ingestFiles(fileList: FileList | File[]) {
    try {
      const droppedFiles = Array.from(fileList);

      if (droppedFiles.length === 0) {
        return;
      }

      const existingNames = new Set(storedDocuments.map((document) => document.name));
      const importedDocuments: MarkdownLibraryDocument[] = [];

      for (const file of droppedFiles) {
        const name = uniqueDocumentName(existingNames, file.name || "untitled.md");
        existingNames.add(name);
        const content = await file.text();
        const id = crypto.randomUUID();
        const savedDocument = await saveMarkdownDocument({
          id,
          name,
          content
        });
        importedDocuments.push({
          ...savedDocument,
          content
        });
      }

      await refreshStoredDocuments();
      setOpenDocuments((currentOpenDocuments) => [...currentOpenDocuments, ...importedDocuments]);
      setActiveDocumentId(importedDocuments[importedDocuments.length - 1].id);
    } catch (error) {
      console.error("Failed to import markdown documents.", error);
    } finally {
      onStorageChange?.();
    }
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
          <ActivityTree
            items={explorerItems}
            header="FILES"
            count={storedDocuments.length}
            onSelect={(item) => openDocument(item.id ?? item.name)}
            onDelete={(item) => deleteDocument(item.id ?? item.name)}
          />
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
          onSelect={(file) => openDocument(file.id ?? file.name)}
          onClose={(file) => closeDocument(file.id ?? file.name)}
        />

        <section className="editor-panel editor-panel--compact">
          {activeDocument ? (
            <MarkdownPreview label={activeDocument.name} content={activeDocument.content} />
          ) : (
            <div className="markdown-viewer-empty-state" aria-label="No file open">
              <p className="markdown-viewer-empty-state__message">
                Open a file from the left or drag and drop one here to get started.
              </p>
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
