import type { WorkspaceFileItem } from "./types";

type ActivityTabsProps = {
  files: WorkspaceFileItem[];
  onSelect?: (file: WorkspaceFileItem) => void;
};

export function ActivityTabs({ files, onSelect }: ActivityTabsProps) {
  return (
    <div className="tab-strip" role="tablist" aria-label="Open files">
      {files.map((file) => (
        <button
          key={file.name}
          type="button"
          className={`tab ${file.active ? "tab--active" : ""}`}
          role="tab"
          aria-selected={file.active}
          onClick={onSelect ? () => onSelect(file) : undefined}
        >
          <span className={`file-chip file-chip--${file.kind}`}>{file.kind.toUpperCase()}</span>
          <span>{file.name}</span>
          <span className="tab__close" aria-hidden="true">
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
