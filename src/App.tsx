import { useEffect, useState } from "react";

type ToolApp = {
  id: string;
  icon: string;
  name: string;
  description: string;
  render: () => JSX.Element;
};

const apps: ToolApp[] = [
  {
    id: "hello-world",
    icon: "👋",
    name: "Hello World",
    description: "Starter app for testing the shell layout.",
    render: () => (
      <section className="tool-panel">
        <div className="tool-panel__hero">
          <p className="tool-panel__eyebrow">Hello World</p>
          <h1>Hello World</h1>
          <p>This is the first app inside Tool Bench.</p>
        </div>
      </section>
    )
  }
];

function useStorageQuota() {
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadQuota() {
      if (!navigator.storage?.estimate) {
        return;
      }

      const estimate = await navigator.storage.estimate();

      if (!cancelled) {
        setQuota({
          usage: estimate.usage ?? 0,
          quota: estimate.quota ?? 0
        });
      }
    }

    void loadQuota();

    return () => {
      cancelled = true;
    };
  }, []);

  return quota;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState(apps[0].id);
  const quota = useStorageQuota();

  const activeApp = apps.find((app) => app.id === activeAppId) ?? apps[0];
  const percentUsed =
    quota && quota.quota > 0 ? Math.min((quota.usage / quota.quota) * 100, 100) : 0;

  return (
    <div className="shell">
      <header className="topbar">
        <button
          className="icon-button"
          type="button"
          aria-label="Open app menu"
          aria-expanded={menuOpen}
          aria-controls="app-drawer"
          onClick={() => setMenuOpen((value) => !value)}
        >
          ☰
        </button>

        <div className="topbar__title">
          <span className="topbar__label">Current app</span>
          <strong>
            <span className="app-chip__icon" aria-hidden="true">
              {activeApp.icon}
            </span>
            {activeApp.name}
          </strong>
        </div>

        <div className="quota">
          <div className="quota__meta">
            <span className="topbar__label">Storage quota</span>
            <span>
              {quota
                ? `${formatBytes(quota.usage)} / ${formatBytes(quota.quota)}`
                : "Unavailable"}
            </span>
          </div>
          <div
            className="quota__bar"
            role="progressbar"
            aria-label="Storage quota"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentUsed)}
          >
            <div className="quota__fill" style={{ width: `${percentUsed}%` }} />
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside
          id="app-drawer"
          className={`drawer ${menuOpen ? "drawer--open" : ""}`}
        >
          <div className="drawer__header">
            <p className="drawer__eyebrow">Applications</p>
            <button
              className="drawer__close"
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close app menu"
            >
              ×
            </button>
          </div>

          <nav className="drawer__list" aria-label="Applications">
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                className={`drawer__item ${
                  app.id === activeApp.id ? "drawer__item--active" : ""
                }`}
                onClick={() => {
                  setActiveAppId(app.id);
                  setMenuOpen(false);
                }}
              >
                <span className="drawer__icon" aria-hidden="true">
                  {app.icon}
                </span>
                <div className="drawer__item-copy">
                  <strong>{app.name}</strong>
                  <span>{app.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        <main className="content">{activeApp.render()}</main>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}
