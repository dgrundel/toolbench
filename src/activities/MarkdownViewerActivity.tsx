import { useEffect, useRef, useState, type DragEvent } from "react";
import { ActivitySidebar } from "../ui/workspace/ActivitySidebar";
import { ActivityTabs } from "../ui/workspace/ActivityTabs";
import { ActivityTree } from "../ui/workspace/ActivityTree";
import { ActivityToolbar } from "../ui/workspace/ActivityToolbar";
import { Modal } from "../ui/workspace/Modal";
import {
  MarkdownPreview,
  markdownToClipboardHtml,
  type MarkdownPreviewSelection
} from "../ui/workspace/MarkdownPreview";
import { WorkspaceIcon } from "../ui/workspace/WorkspaceIcon";
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

type PageHighlight = MarkdownPreviewSelection & {
  id: string;
};

export function MarkdownViewerActivity({ onStorageChange }: MarkdownViewerActivityProps) {
  const [storedDocuments, setStoredDocuments] = useState<MarkdownLibrarySummary[]>([]);
  const [openDocuments, setOpenDocuments] = useState<MarkdownLibraryDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<"sidebar" | "editor" | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "markdown" | "rendered">("idle");
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightsByDocumentId, setHighlightsByDocumentId] = useState<Record<string, PageHighlight[]>>({});
  const [highlightDeleteTarget, setHighlightDeleteTarget] = useState<PageHighlight | null>(null);
  const openRequestIdRef = useRef(0);
  const openRequestDocumentIdRef = useRef<string | null>(null);
  const activeDocumentIdRef = useRef<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const previewPaneRef = useRef<HTMLDivElement | null>(null);

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
  const activeHighlights = activeDocumentId ? highlightsByDocumentId[activeDocumentId] ?? [] : [];
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

  async function copyMarkdownToClipboard() {
    if (!activeDocument) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeDocument.content);
      setCopyStatus("markdown");

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopyStatus("idle");
        copyResetTimerRef.current = null;
      }, 1200);
    } catch (error) {
      console.error(`Failed to copy markdown for ${activeDocument.name}.`, error);
    }
  }

  async function copyRenderedMarkdownToClipboard() {
    if (!activeDocument) {
      return;
    }

    try {
      const renderedHtml = markdownToClipboardHtml(activeDocument.content);

      if ("ClipboardItem" in window && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          "text/html": new Blob([renderedHtml], { type: "text/html" }),
          "text/plain": new Blob([activeDocument.content], { type: "text/plain" })
        });

        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(activeDocument.content);
      }

      setCopyStatus("rendered");

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopyStatus("idle");
        copyResetTimerRef.current = null;
      }, 1200);
    } catch (error) {
      console.error(`Failed to copy rendered markdown for ${activeDocument.name}.`, error);
    }
  }

  function handleCreateHighlight(selection: MarkdownPreviewSelection) {
    if (!activeDocumentId) {
      return;
    }

    const newHighlight: PageHighlight = {
      id: crypto.randomUUID(),
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      excerpt: selection.excerpt
    };

    setHighlightsByDocumentId((currentHighlights) => {
      const current = currentHighlights[activeDocumentId] ?? [];

      return {
        ...currentHighlights,
        [activeDocumentId]: [...current, newHighlight]
      };
    });
  }

  function handleDeleteHighlight(highlightId: string) {
    if (!activeDocumentId) {
      return;
    }

    setHighlightsByDocumentId((currentHighlights) => {
      const current = currentHighlights[activeDocumentId] ?? [];
      const nextHighlights = current.filter((highlight) => highlight.id !== highlightId);

      return {
        ...currentHighlights,
        [activeDocumentId]: nextHighlights
      };
    });
  }

  function requestDeleteHighlight(highlight: PageHighlight) {
    setHighlightDeleteTarget(highlight);
  }

  function confirmDeleteHighlight() {
    if (!highlightDeleteTarget) {
      return;
    }

    handleDeleteHighlight(highlightDeleteTarget.id);
    setHighlightDeleteTarget(null);
  }

  function scrollToHighlight(highlight: PageHighlight) {
    const previewPane = previewPaneRef.current;

    if (!previewPane) {
      return;
    }

    const anchor =
      previewPane.querySelector<HTMLElement>(
        `[data-source-start="${highlight.startOffset}"][data-source-end="${highlight.endOffset}"]`
      ) ?? previewPane.querySelector<HTMLElement>(`[data-source-start="${highlight.startOffset}"]`);

    anchor?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

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
          <div className="markdown-viewer__panel-body">
            <ActivityToolbar label="Markdown tools">
              <button
                type="button"
                className={`editor-panel__toolbar-button ${
                  highlightMode ? "editor-panel__toolbar-button--active" : ""
                }`}
                aria-pressed={highlightMode}
                onClick={() => setHighlightMode((current) => !current)}
              >
                <WorkspaceIcon
                  name={highlightMode ? "highlight" : "highlight-off"}
                  size={14}
                  className="editor-panel__toolbar-button-icon"
                />
                {highlightMode ? "Highlight Mode On" : "Highlight Mode"}
              </button>
              <button
                type="button"
                className="editor-panel__toolbar-button"
                onClick={copyMarkdownToClipboard}
                disabled={!activeDocument}
              >
                <WorkspaceIcon name="copy" size={14} className="editor-panel__toolbar-button-icon" />
                {copyStatus === "markdown" ? "Copied Markdown" : "Copy Markdown"}
              </button>
              <button
                type="button"
                className="editor-panel__toolbar-button"
                onClick={copyRenderedMarkdownToClipboard}
                disabled={!activeDocument}
              >
                <WorkspaceIcon name="file-html" size={14} className="editor-panel__toolbar-button-icon" />
                {copyStatus === "rendered" ? "Copied Rendered" : "Copy Rendered"}
              </button>
            </ActivityToolbar>

            {activeDocument ? (
              <div className="markdown-viewer__workspace">
                <div className="markdown-viewer__preview-pane" ref={previewPaneRef}>
                  <MarkdownPreview
                    label={activeDocument.name}
                    content={activeDocument.content}
                    highlightMode={highlightMode}
                    highlights={activeHighlights}
                    onCreateHighlight={handleCreateHighlight}
                  />
                </div>
                <aside className="markdown-viewer__highlights-pane" aria-label="Highlights panel">
                  <div className="markdown-viewer-highlights">
                    <div className="markdown-viewer-highlights__header">
                      <span>HIGHLIGHTS</span>
                      <span className="markdown-viewer-highlights__count">{activeHighlights.length}</span>
                    </div>
                    <div className="markdown-viewer-highlights__body">
                      {activeHighlights.length > 0 ? (
                        activeHighlights.map((highlight, index) => (
                          <div key={highlight.id} className="markdown-viewer-highlights__item">
                            <span className="markdown-viewer-highlights__swatch">{index + 1}</span>
                            <span className="markdown-viewer-highlights__copy">
                              <span className="markdown-viewer-highlights__excerpt">{highlight.excerpt}</span>
                              <span className="markdown-viewer-highlights__meta">{`Range ${highlight.startOffset + 1}-${highlight.endOffset}`}</span>
                            </span>
                            <span className="markdown-viewer-highlights__actions">
                              <button
                                type="button"
                                className="markdown-viewer-highlights__jump"
                                aria-label={`Jump to highlight: ${highlight.excerpt}`}
                                onClick={() => scrollToHighlight(highlight)}
                              >
                                <WorkspaceIcon
                                  name="bookmark"
                                  size={14}
                                  className="markdown-viewer-highlights__jump-icon"
                                />
                              </button>
                              <button
                                type="button"
                                className="markdown-viewer-highlights__delete"
                                aria-label={`Delete highlight: ${highlight.excerpt}`}
                                onClick={() => requestDeleteHighlight(highlight)}
                              >
                                <WorkspaceIcon
                                  name="delete"
                                  size={14}
                                  className="markdown-viewer-highlights__delete-icon"
                                />
                              </button>
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="markdown-viewer-highlights__empty">No highlights yet.</div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="markdown-viewer-empty-state" aria-label="No file open">
                <p className="markdown-viewer-empty-state__message">
                  Open a file from the left or drag and drop one here to get started.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Modal
        open={highlightDeleteTarget !== null}
        title="Remove Highlight"
        onClose={() => setHighlightDeleteTarget(null)}
        actions={
          <>
            <button type="button" className="modal__button modal__button--secondary" onClick={() => setHighlightDeleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="modal__button modal__button--destructive" onClick={confirmDeleteHighlight}>
              Remove
            </button>
          </>
        }
      >
        <p className="modal__text">Are you sure you want to remove this highlight?</p>
        <p className="modal__text modal__text--muted">
          This will delete the highlight from the current page only.
        </p>
      </Modal>
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
