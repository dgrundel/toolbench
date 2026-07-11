# Toolbench Agents Guide

## What This Project Is

Toolbench is a multi-activity workspace prototype inspired by Visual Studio Code.
The goal is to build a shell that can host several independent tools and let the
user switch between them from a persistent activity rail on the left.

## Current Layout

- The far-left vertical rail is the persistent activity selector.
- The main content area changes based on the selected activity.
- The bottom status bar is persistent and spans the content columns.
- The current visual style is a light, flat, VS Code-like interface with neutral
  grays and restrained blue accents.

## Current Activity

- The only activity right now is `Demo`.
- `Demo` keeps the current fake explorer/editor layout.
- The demo activity lives in its own React component so it can be replaced or
  expanded without changing the shell.

## Design Direction

- Keep the shell simple, flat, and workmanlike.
- Avoid gradients and heavy visual effects unless they serve a clear purpose.
- Preserve the persistent rail and status bar as stable chrome.
- Treat activity content as swappable modules that can evolve independently.

## Working Notes

- When adding a new activity, prefer creating a separate component for it.
- Keep activity labels short and clear in the rail.
- Reuse the existing shell structure instead of rebuilding the outer layout for
  each new activity.
