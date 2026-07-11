import { useEffect, useState } from "react";
import { DemoActivity } from "./activities/DemoActivity";
import { MarkdownViewerActivity } from "./activities/MarkdownViewerActivity";
import { WorkspaceIcon, type WorkspaceIconName } from "./ui/workspace/WorkspaceIcon";

type StorageEstimate = {
  usage: number;
  quota: number;
};

type ActivityProps = {
  onStorageChange?: () => void;
};

type ActivityId = "markdown-viewer" | "demo";

const activities: Array<{
  id: ActivityId;
  label: string;
  icon: WorkspaceIconName;
  render: (props: ActivityProps) => JSX.Element;
}> = [
  {
    id: "markdown-viewer",
    label: "Markdown Viewer",
    icon: "activity-markdown",
    render: (props) => <MarkdownViewerActivity onStorageChange={props.onStorageChange} />
  },
  {
    id: "demo",
    label: "Demo",
    icon: "activity-demo",
    render: () => <DemoActivity />
  }
];

function useStorageQuota() {
  const [quota, setQuota] = useState<StorageEstimate | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

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
  }, [reloadCount]);

  return {
    quota,
    refresh: () => setReloadCount((count) => count + 1)
  };
}

export default function App() {
  const { quota, refresh } = useStorageQuota();
  const [activeActivityId, setActiveActivityId] = useState<ActivityId>("markdown-viewer");
  const percentUsed =
    quota && quota.quota > 0 ? Math.min((quota.usage / quota.quota) * 100, 100) : 0;

  const activeActivity = activities.find((activity) => activity.id === activeActivityId) ?? activities[0];

  return (
    <div className="vscode-shell">
      <aside className="activity-bar" aria-label="Primary">
        {activities.map((activity) => (
          <button
            key={activity.id}
            className={`activity-bar__button ${
              activity.id === activeActivity.id ? "activity-bar__button--active" : ""
            }`}
            type="button"
            aria-label={activity.label}
            aria-pressed={activity.id === activeActivity.id}
            onClick={() => setActiveActivityId(activity.id)}
          >
            <WorkspaceIcon name={activity.icon} />
            <span className="activity-bar__tooltip" role="tooltip">
              {activity.label}
            </span>
          </button>
        ))}
      </aside>

      {activeActivity.render({ onStorageChange: refresh })}

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
