import type { WorkspaceFileItem } from "./types";
import { WorkspaceIcon } from "./WorkspaceIcon";

type ActivityTabsProps = {
  files: WorkspaceFileItem[];
  onSelect?: (file: WorkspaceFileItem) => void;
  onClose?: (file: WorkspaceFileItem) => void;
};

export function ActivityTabs({ files, onSelect, onClose }: ActivityTabsProps) {
  return (
    <div className="tab-strip" role="tablist" aria-label="Open files">
      {files.map((file) => (
        <button
          key={file.id ?? file.name}
          type="button"
          className={`tab ${file.active ? "tab--active" : ""}`}
          role="tab"
          aria-selected={file.active}
          onClick={
            onSelect || onClose
              ? (event) => {
                  const target = event.target as HTMLElement | null;

                  if (target?.closest("[data-tab-close]")) {
                    onClose?.(file);
                    return;
                  }

                  onSelect?.(file);
                }
              : undefined
          }
          >
          <span className={`file-chip file-chip--${file.kind}`} aria-hidden="true">
            <WorkspaceIcon name={fileKindIconName(file.kind)} size={15} />
          </span>
          <span>{file.name}</span>
          <span className="tab__close" aria-hidden="true" data-tab-close="true">
            <WorkspaceIcon name="close" size={14} />
          </span>
        </button>
      ))}
    </div>
  );
}

function fileKindIconName(kind: WorkspaceFileItem["kind"]) {
  switch (kind) {
    case "tsx":
      return "file-tsx";
    case "css":
      return "file-css";
    case "md":
      return "file-md";
    case "json":
      return "file-json";
    default:
      return "file";
  }
}
