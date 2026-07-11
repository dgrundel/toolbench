import type { WorkspaceTreeItem } from "./types";
import { WorkspaceIcon } from "./WorkspaceIcon";

type ActivityTreeProps = {
  items: WorkspaceTreeItem[];
  header?: string;
  count?: string | number;
  onSelect?: (item: WorkspaceTreeItem) => void;
  onDelete?: (item: WorkspaceTreeItem) => void;
};

export function ActivityTree({ items, header, count, onSelect, onDelete }: ActivityTreeProps) {
  return (
    <section className="sidebar-section sidebar-section--tree">
      {header ? (
        <div className="sidebar-section__header">
          <span>{header}</span>
          {count !== undefined ? <span className="sidebar-section__count">{count}</span> : null}
        </div>
      ) : null}

      <div className="tree">
        {items.map((item) => (
          <div
            key={item.id ?? item.name}
            className={`tree__item tree__item--${item.type} ${item.active ? "tree__item--active" : ""}`}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={onSelect ? () => onSelect(item) : undefined}
            onKeyDown={
              onSelect
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(item);
                    }
                  }
                : undefined
            }
          >
            <span className="tree__item-main">
              <span className="tree__glyph" aria-hidden="true">
                <WorkspaceIcon name={item.type === "folder" ? "folder" : "file"} size={16} />
              </span>
              <span>{item.name}</span>
            </span>
            {onDelete ? (
              <button
                type="button"
                className="tree__delete"
                aria-label={`Delete ${item.name}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(item);
                }}
              >
                <WorkspaceIcon name="delete" size={14} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
