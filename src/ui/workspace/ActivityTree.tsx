import type { WorkspaceTreeItem } from "./types";

type ActivityTreeProps = {
  items: WorkspaceTreeItem[];
  header?: string;
  count?: string | number;
};

export function ActivityTree({ items, header, count }: ActivityTreeProps) {
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
