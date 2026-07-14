import {
  IconDotsVertical,
  IconCopy,
  IconMessage2,
  IconFileCode,
  IconFileTypeCss,
  IconFileTypeHtml,
  IconFileTypeJs,
  IconFileTypeTsx,
  IconFileText,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconLayoutGrid,
  IconHighlight,
  IconHighlightOff,
  IconMarkdown,
  IconBookmark,
  IconPlayerPlay,
  IconPencil,
  IconSquare2,
  IconTrash,
  IconX
} from "@tabler/icons-react";

type WorkspaceIconName =
  | "activity-markdown"
  | "activity-demo"
  | "home"
  | "more-actions"
  | "file-tsx"
  | "file-js"
  | "file-css"
  | "file-html"
  | "file-md"
  | "file-json"
  | "file"
  | "folder"
  | "delete"
  | "copy"
  | "comment"
  | "highlight"
  | "highlight-off"
  | "bookmark"
  | "edit"
  | "player-play"
  | "alert-triangle"
  | "caret-down"
  | "caret-right"
  | "close";

type WorkspaceIconProps = {
  name: WorkspaceIconName;
  size?: number;
  className?: string;
};

const iconMap = {
  "activity-markdown": IconMarkdown,
  "activity-demo": IconSquare2,
  home: IconLayoutGrid,
  "more-actions": IconDotsVertical,
  "file-tsx": IconFileTypeTsx,
  "file-js": IconFileTypeJs,
  "file-css": IconFileTypeCss,
  "file-html": IconFileTypeHtml,
  "file-md": IconMarkdown,
  "file-json": IconFileCode,
  file: IconFileText,
  folder: IconFolder,
  delete: IconTrash,
  copy: IconCopy,
  comment: IconMessage2,
  highlight: IconHighlight,
  "highlight-off": IconHighlightOff,
  bookmark: IconBookmark,
  edit: IconPencil,
  "player-play": IconPlayerPlay,
  "alert-triangle": IconAlertTriangle,
  "caret-down": IconChevronDown,
  "caret-right": IconChevronRight,
  close: IconX
} as const;

export function WorkspaceIcon({ name, size = 20, className }: WorkspaceIconProps) {
  const Icon = iconMap[name];

  return <Icon className={className} size={size} stroke={1.8} aria-hidden="true" focusable="false" />;
}

export type { WorkspaceIconName };
