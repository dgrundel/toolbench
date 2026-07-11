import type { WorkspaceTreeItem } from "./types";

type ActivityTreeProps = {
  items: WorkspaceTreeItem[];
  header?: string;
  count?: string | number;
  onSelect?: (item: WorkspaceTreeItem) => void;
};

export function ActivityTree({ items, header, count, onSelect }: ActivityTreeProps) {
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
            key={item.name}
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
            <span className="tree__glyph" aria-hidden="true">
              {item.type === "folder" ? "▸" : "•"}
            </span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
