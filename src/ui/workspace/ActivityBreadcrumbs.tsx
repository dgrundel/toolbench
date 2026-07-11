type ActivityBreadcrumbsProps = {
  crumbs: string[];
};

export function ActivityBreadcrumbs({ crumbs }: ActivityBreadcrumbsProps) {
  return (
    <div className="editor-panel__breadcrumbs">
      {crumbs.map((crumb) => (
        <span key={crumb}>{crumb}</span>
      ))}
    </div>
  );
}
