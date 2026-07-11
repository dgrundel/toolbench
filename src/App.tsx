import { useEffect, useState } from "react";
import { DemoActivity } from "./activities/DemoActivity";

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
          aria-label="Demo"
        >
          <span aria-hidden="true">▣</span>
          <span className="activity-bar__tooltip" role="tooltip">
            Demo
          </span>
        </button>
      </aside>

      <DemoActivity />

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
