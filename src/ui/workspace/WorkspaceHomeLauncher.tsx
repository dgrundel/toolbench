import { WorkspaceIcon, type WorkspaceIconName } from "./WorkspaceIcon";

export type WorkspaceHomeLaunchItem = {
  id: string;
  label: string;
  icon: WorkspaceIconName;
};

type WorkspaceHomeLauncherProps = {
  items: WorkspaceHomeLaunchItem[];
  onSelect: (id: string) => void;
};

export function WorkspaceHomeLauncher({ items, onSelect }: WorkspaceHomeLauncherProps) {
  return (
    <main className="workspace-home" aria-label="Workspace home">
      <div className="workspace-home__inner">
        <div className="workspace-home__hero">
          <WorkspaceIcon name="home" size={28} className="workspace-home__hero-icon" />
          <div>
            <h1 className="workspace-home__title">Workspace Home</h1>
            <p className="workspace-home__subtitle">Choose an activity to start working.</p>
          </div>
        </div>

        <div className="workspace-home__grid" aria-label="Available activities">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="workspace-home__tile"
              aria-label={`Open ${item.label}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="workspace-home__tile-icon-slot" aria-hidden="true">
                <WorkspaceIcon name={item.icon} size={72} className="workspace-home__tile-icon" />
              </span>
              <span className="workspace-home__tile-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
