export type WorkspaceFileItem = {
  name: string;
  kind: "tsx" | "css" | "md" | "json";
  active?: boolean;
};

export type WorkspaceTreeItem = {
  name: string;
  type: "folder" | "file";
  active?: boolean;
};

export type WorkspaceLineItem = {
  code: string;
};
