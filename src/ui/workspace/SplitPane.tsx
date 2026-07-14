import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type SplitPaneAxis = "horizontal" | "vertical";

type SplitPaneProps = {
  axis?: SplitPaneAxis;
  primary: ReactNode;
  secondary: ReactNode;
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onSizeChange?: (size: number) => void;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  dividerClassName?: string;
  dividerLabel?: string;
};

const DEFAULT_SIZE = 320;
const DEFAULT_MIN_SIZE = 220;
const DIVIDER_SIZE = 6;

export function SplitPane({
  axis = "horizontal",
  primary,
  secondary,
  size,
  defaultSize = DEFAULT_SIZE,
  minSize = DEFAULT_MIN_SIZE,
  maxSize,
  onSizeChange,
  className,
  primaryClassName,
  secondaryClassName,
  dividerClassName,
  dividerLabel = "Resize panel"
}: SplitPaneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startPosition: number;
    startSize: number;
  } | null>(null);
  const [internalSize, setInternalSize] = useState(defaultSize);
  const [containerSize, setContainerSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isControlled = size !== undefined;
  const currentSize = size ?? internalSize;

  const maxAllowedSize = useMemo(() => {
    const availableSpace = Math.max(0, containerSize - minSize - DIVIDER_SIZE);
    const fallbackMax = maxSize ?? availableSpace;
    return Math.max(minSize, Math.min(fallbackMax, availableSpace));
  }, [containerSize, maxSize, minSize]);

  const displayedSize = useMemo(() => {
    if (containerSize <= 0) {
      return currentSize;
    }

    return clampSize(currentSize, minSize, maxAllowedSize);
  }, [currentSize, containerSize, maxAllowedSize, minSize]);

  useEffect(() => {
    if (!rootRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const nextSize = axis === "horizontal" ? entry.contentRect.width : entry.contentRect.height;
      setContainerSize(nextSize);
    });

    observer.observe(rootRef.current);

    return () => {
      observer.disconnect();
    };
  }, [axis]);

  useEffect(() => {
    if (containerSize <= 0) {
      return;
    }

    const clampedSize = clampSize(currentSize, minSize, maxAllowedSize);

    if (clampedSize === currentSize) {
      return;
    }

    if (isControlled) {
      onSizeChange?.(clampedSize);
    } else {
      setInternalSize(clampedSize);
    }
  }, [currentSize, isControlled, maxAllowedSize, minSize, onSizeChange, containerSize]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;

    document.body.style.userSelect = "none";
    document.body.style.cursor = axis === "horizontal" ? "col-resize" : "row-resize";

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [axis, isDragging]);

  function updateSize(nextSize: number) {
    const clamped = clampSize(nextSize, minSize, maxAllowedSize);

    if (isControlled) {
      onSizeChange?.(clamped);
      return;
    }

    setInternalSize(clamped);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startPosition: axis === "horizontal" ? event.clientX : event.clientY,
      startSize: displayedSize
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const currentPosition = axis === "horizontal" ? event.clientX : event.clientY;
    const delta = currentPosition - dragState.startPosition;
    updateSize(dragState.startSize - delta);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 64 : 16;

    if (axis === "horizontal") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateSize(displayedSize + step);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        updateSize(displayedSize - step);
      }
    } else {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        updateSize(displayedSize + step);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        updateSize(displayedSize - step);
      }
    }

    if (event.key === "Home") {
      event.preventDefault();
      updateSize(minSize);
    }

    if (event.key === "End") {
      event.preventDefault();
      updateSize(maxAllowedSize);
    }
  }

  if (!secondary) {
    return <div className={className}>{primary}</div>;
  }

  return (
    <div
      ref={rootRef}
      className={[
        "split-pane",
        axis === "horizontal" ? "split-pane--horizontal" : "split-pane--vertical",
        isDragging ? "split-pane--dragging" : "",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={["split-pane__pane", "split-pane__pane--primary", primaryClassName ?? ""]
          .filter(Boolean)
          .join(" ")}
      >
        {primary}
      </div>
      <div
        className={["split-pane__divider", dividerClassName ?? ""].filter(Boolean).join(" ")}
        role="separator"
        tabIndex={0}
        aria-label={dividerLabel}
        aria-orientation={axis === "horizontal" ? "vertical" : "horizontal"}
        aria-valuemin={minSize}
        aria-valuemax={maxAllowedSize}
        aria-valuenow={Math.round(displayedSize)}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div
        className={["split-pane__pane", "split-pane__pane--secondary", secondaryClassName ?? ""]
          .filter(Boolean)
          .join(" ")}
        style={axis === "horizontal" ? { width: displayedSize } : { height: displayedSize }}
      >
        {secondary}
      </div>
    </div>
  );
}

function clampSize(size: number, minSize: number, maxSize: number) {
  if (Number.isNaN(size)) {
    return minSize;
  }

  return Math.max(minSize, Math.min(maxSize, size));
}
