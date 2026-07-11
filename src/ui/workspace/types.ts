import type { ReactNode } from "react";

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
  no: number;
  code: string;
};

export type WorkspaceEditorProps = {
  label: string;
  lines: WorkspaceLineItem[];
  inspector?: ReactNode;
};
