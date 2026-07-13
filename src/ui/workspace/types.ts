export type WorkspaceFileItem = {
  id?: string;
  name: string;
  kind: "tsx" | "js" | "css" | "md" | "json";
  active?: boolean;
};

export type WorkspaceTreeItem = {
  id?: string;
  name: string;
  type: "folder" | "file";
  active?: boolean;
};

export type WorkspaceLineItem = {
  code: string;
};
