type ActivityInspectorCardProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function ActivityInspectorCard({ eyebrow, title, body }: ActivityInspectorCardProps) {
  return (
    <div className="editor-hint__card">
      <p className="editor-hint__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  );
}
