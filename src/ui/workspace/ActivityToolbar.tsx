import type { ReactNode } from "react";

type ActivityToolbarProps = {
  children: ReactNode;
  label?: string;
};

export function ActivityToolbar({ children, label = "Toolbar" }: ActivityToolbarProps) {
  return (
    <div className="editor-panel__toolbar" role="toolbar" aria-label={label}>
      {children}
    </div>
  );
}
