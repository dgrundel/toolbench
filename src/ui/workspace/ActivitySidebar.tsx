import type { ReactNode } from "react";
import { ActivityHeader } from "./ActivityHeader";

type ActivitySidebarProps = {
  title: string;
  actionLabel?: string;
  children: ReactNode;
};

export function ActivitySidebar({ title, actionLabel, children }: ActivitySidebarProps) {
  return (
    <aside className="sidebar">
      <ActivityHeader title={title} actionLabel={actionLabel} />
      {children}
    </aside>
  );
}
