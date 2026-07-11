import { useEffect, useState } from "react";

const files = [
  { name: "app.tsx", kind: "tsx", active: true },
  { name: "theme.css", kind: "css" },
  { name: "README.md", kind: "md" },
  { name: "data.json", kind: "json" }
];

const editorLines = [
  { no: 1, code: "import { Panel } from './ui/Panel';" },
  { no: 2, code: "import { Sidebar } from './ui/Sidebar';" },
  { no: 3, code: "" },
  { no: 4, code: "export default function AppShell() {" },
  { no: 5, code: "  return (" },
  { no: 6, code: "    <Workspace" },
  { no: 7, code: "      tone=\"light\"" },
  { no: 8, code: "      density=\"compact\"" },
  { no: 9, code: "    />" },
  { no: 10, code: "  );" },
  { no: 11, code: "}" }
];

const explorerItems = [
  { name: "src", type: "folder", open: true },
  { name: "components", type: "folder" },
  { name: "styles", type: "folder" },
  { name: "app.tsx", type: "file", active: true },
  { name: "theme.css", type: "file" },
  { name: "index.tsx", type: "file" }
];

type StorageEstimate = {
  usage: number;
  quota: number;
};

function useStorageQuota() {
  const [quota, setQuota] = useState<StorageEstimate | null>(null);

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
  const quota = useStorageQuota();
  const percentUsed =
    quota && quota.quota > 0 ? Math.min((quota.usage / quota.quota) * 100, 100) : 0;

  return (
    <div className="vscode-shell">
      <aside className="activity-bar" aria-label="Primary">
        <button
          className="activity-bar__button activity-bar__button--active"
          type="button"
          aria-label="Explorer"
        >
          <span aria-hidden="true">▣</span>
          <span className="activity-bar__tooltip" role="tooltip">
            Explorer
          </span>
        </button>
        <button className="activity-bar__button" type="button" aria-label="Search">
          <span aria-hidden="true">⌕</span>
          <span className="activity-bar__tooltip" role="tooltip">
            Search
          </span>
        </button>
        <button className="activity-bar__button" type="button" aria-label="Source control">
          <span aria-hidden="true">⎇</span>
          <span className="activity-bar__tooltip" role="tooltip">
            Source Control
          </span>
        </button>
        <button className="activity-bar__button" type="button" aria-label="Run and Debug">
          <span aria-hidden="true">▷</span>
          <span className="activity-bar__tooltip" role="tooltip">
            Run and Debug
          </span>
        </button>
      </aside>

      <aside className="sidebar">
        <div className="panel-titlebar">
          <span>EXPLORER</span>
          <button type="button" className="icon-mini" aria-label="More actions">
            …
          </button>
        </div>

        <section className="sidebar-section sidebar-section--tree">
          <div className="sidebar-section__header">
            <span>PROJECT</span>
            <span className="sidebar-section__count">4</span>
          </div>
          <div className="tree">
            {explorerItems.map((item) => (
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
      </aside>

      <main className="editor-shell">
        <div className="tab-strip" role="tablist" aria-label="Open files">
          {files.map((file) => (
            <button
              key={file.name}
              type="button"
              className={`tab ${file.active ? "tab--active" : ""}`}
              role="tab"
              aria-selected={file.active}
            >
              <span className={`file-chip file-chip--${file.kind}`}>{file.kind.toUpperCase()}</span>
              <span>{file.name}</span>
              <span className="tab__close" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
        </div>

        <section className="editor-panel">
          <div className="editor-panel__breadcrumbs">
            <span>src</span>
            <span>/</span>
            <span>app.tsx</span>
            <span>/</span>
            <span>Workspace</span>
          </div>

          <div className="editor">
            <div className="gutter" aria-hidden="true">
              {editorLines.map((line) => (
                <div key={line.no} className="gutter__line">
                  {line.no}
                </div>
              ))}
            </div>

            <pre className="code" aria-label="Example editor">
              {editorLines.map((line) => (
                <code key={line.no} className="code__line">
                  {line.code || "\u00A0"}
                </code>
              ))}
            </pre>

            <aside className="editor-hint">
              <div className="editor-hint__card">
                <p className="editor-hint__eyebrow">Light theme</p>
                <h1>Neutral panels, blue emphasis, square geometry.</h1>
                <p>
                  This rebuild leans on the VS Code desktop language: slim borders, subdued chrome,
                  tabbed editing, and a soft accent line instead of heavy shadows.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="status-bar" aria-label="Status bar">
        <div className="status-quota">
          <span className="status-quota__label">Storage</span>
          <div
            className="status-quota__track"
            role="progressbar"
            aria-label="Storage quota"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentUsed)}
          >
            <div className="status-quota__fill" style={{ width: `${percentUsed}%` }} />
          </div>
          <span className="status-quota__numbers">
            {quota
              ? `${formatBytes(quota.usage)} / ${formatBytes(quota.quota)}`
              : "Storage quota unavailable"}
          </span>
        </div>
      </footer>
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
