export type WorkspaceActivityId = "home" | "demo" | "markdown-viewer";

export type WorkspaceRouteActivityId = Exclude<WorkspaceActivityId, "home">;

const ACTIVITY_PATHS: Record<WorkspaceRouteActivityId, string> = {
  demo: "/demo",
  "markdown-viewer": "/markdown-viewer"
};

export function getWorkspaceActivityId(pathname: string): WorkspaceActivityId {
  if (pathname === ACTIVITY_PATHS.demo) {
    return "demo";
  }

  if (pathname === ACTIVITY_PATHS["markdown-viewer"]) {
    return "markdown-viewer";
  }

  return "home";
}

export function getWorkspaceActivityPath(activityId: WorkspaceRouteActivityId): string {
  return ACTIVITY_PATHS[activityId];
}

export function getMarkdownViewerFileId(search: string): string | null {
  return new URLSearchParams(search).get("file");
}

export function buildMarkdownViewerSearch(fileId: string | null): string {
  const searchParams = new URLSearchParams();

  if (fileId) {
    searchParams.set("file", fileId);
  }

  const search = searchParams.toString();

  return search.length > 0 ? `?${search}` : "";
}
