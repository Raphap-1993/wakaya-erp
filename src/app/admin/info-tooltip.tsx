"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./admin-ui.module.css";

type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type SizeLike = {
  width: number;
  height: number;
};

type ViewportLike = {
  width: number;
  height: number;
};

const TOOLTIP_PADDING = 12;
const TOOLTIP_GAP = 12;
const TOOLTIP_MAX_WIDTH = 420;

export function computeTooltipLayout(
  anchor: RectLike,
  bubble: SizeLike,
  viewport: ViewportLike,
) {
  const maxWidth = Math.max(220, Math.min(TOOLTIP_MAX_WIDTH, viewport.width - TOOLTIP_PADDING * 2));
  const effectiveWidth = Math.min(bubble.width, maxWidth);
  const centeredLeft = anchor.left + anchor.width / 2 - effectiveWidth / 2;
  const left = Math.min(
    Math.max(TOOLTIP_PADDING, centeredLeft),
    Math.max(TOOLTIP_PADDING, viewport.width - effectiveWidth - TOOLTIP_PADDING),
  );

  const spaceAbove = anchor.top - TOOLTIP_GAP - TOOLTIP_PADDING;
  const spaceBelow = viewport.height - (anchor.top + anchor.height) - TOOLTIP_GAP - TOOLTIP_PADDING;
  const placement = spaceAbove >= bubble.height || spaceAbove >= spaceBelow ? "top" : "bottom";
  const top =
    placement === "top"
      ? Math.max(TOOLTIP_PADDING, anchor.top - bubble.height - TOOLTIP_GAP)
      : Math.min(
          viewport.height - bubble.height - TOOLTIP_PADDING,
          anchor.top + anchor.height + TOOLTIP_GAP,
        );

  return {
    left,
    top,
    maxWidth,
    placement,
  };
}

export function InfoTooltip({ label }: { label: string }) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLSpanElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<ReturnType<typeof computeTooltipLayout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setLayout(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const bubble = bubbleRef.current;
      if (!anchor || !bubble) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      setLayout(
        computeTooltipLayout(
          {
            left: anchorRect.left,
            top: anchorRect.top,
            width: anchorRect.width,
            height: anchorRect.height,
          },
          {
            width: bubbleRect.width || 280,
            height: bubbleRect.height || 84,
          },
          {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        ),
      );
    };

    const animationFrame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, label]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <span
        ref={anchorRef}
        className={styles.tooltipWrap}
        tabIndex={0}
        aria-label={label}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <span className={styles.tooltipTrigger} aria-hidden={true}>
          i
        </span>
      </span>

      {isMounted && isOpen
        ? createPortal(
            <span
              ref={bubbleRef}
              id={tooltipId}
              role="tooltip"
              data-placement={layout?.placement ?? "top"}
              className={styles.tooltipBubble}
              style={
                layout
                  ? {
                      left: `${layout.left}px`,
                      top: `${layout.top}px`,
                      maxWidth: `${layout.maxWidth}px`,
                    }
                  : {
                      left: "-9999px",
                      top: "-9999px",
                    }
              }
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
