import { WorkspaceIcon } from "./WorkspaceIcon";

type ActivityHeaderProps = {
  title: string;
  actionLabel?: string;
};

export function ActivityHeader({ title, actionLabel = "More actions" }: ActivityHeaderProps) {
  return (
    <div className="panel-titlebar">
      <span>{title}</span>
      <button type="button" className="icon-mini" aria-label={actionLabel}>
        <WorkspaceIcon name="more-actions" size={18} />
      </button>
    </div>
  );
}
