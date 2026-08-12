"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { AUTOFIT_PENDING_ATTRIBUTE } from "@/lib/certificate/autofit";

interface AutoFitTextProps {
  text: string;
  /** The designed size. Only ever reduced, never increased, so ordinary values
   *  render at exactly the size the template was built with. */
  fontSize: number;
  minFontSize: number;
  /** Wrapping blocks only: the tallest the text may grow before it is shrunk. */
  maxHeight?: number;
  /** Blocks sitting on a rule, where a second line would move the rule. */
  singleLine?: boolean;
  className?: string;
  style?: CSSProperties;
}

const STEP_PX = 0.5;
/** Sub-pixel layout means an exact comparison reports overflow that no one can
 *  see, and shrinks text that already fits. */
const TOLERANCE_PX = 0.5;

/** Shrinks a value until it fits its box. Measured in JS because the size that
 *  fits depends on the glyphs, which no CSS expression can ask about. */
export function AutoFitText({
  text,
  fontSize,
  minFontSize,
  maxHeight,
  singleLine = false,
  className,
  style,
}: AutoFitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Keyed rather than reset in the effect: a value that has just changed is
  // pending again on the very render that changes it, with no intermediate state
  // where a stale size looks settled.
  const key = `${text}|${fontSize}|${minFontSize}|${maxHeight}|${singleLine}`;
  const [fitted, setFitted] = useState<{ key: string; size: number } | null>(
    null,
  );
  const settled = fitted?.key === key;
  const size = settled ? fitted.size : fontSize;

  useLayoutEffect(() => {
    let cancelled = false;

    const overflows = (element: HTMLElement) =>
      element.scrollWidth > element.clientWidth + TOLERANCE_PX ||
      (maxHeight !== undefined &&
        element.scrollHeight > maxHeight + TOLERANCE_PX);

    const fit = () => {
      const element = ref.current;
      if (cancelled || !element) return;

      let next = fontSize;
      element.style.fontSize = `${next}px`;
      while (next > minFontSize && overflows(element)) {
        next = Math.max(minFontSize, next - STEP_PX);
        element.style.fontSize = `${next}px`;
      }

      setFitted({ key, size: next });
    };

    // The serif metrics differ enough from the fallback that measuring before
    // the webfont applies picks the wrong size.
    document.fonts.ready.then(fit);

    return () => {
      cancelled = true;
    };
  }, [key, fontSize, minFontSize, maxHeight]);

  return (
    <div
      ref={ref}
      className={className}
      {...(settled ? {} : { [AUTOFIT_PENDING_ATTRIBUTE]: "" })}
      style={{
        ...style,
        fontSize: size,
        ...(singleLine ? { whiteSpace: "nowrap" as const } : {}),
        // Clipping is the backstop for a value that will not fit even at the
        // floor, so it may only apply once a size has been chosen. Applied
        // before that, a render where the fit never runs (no JS) would cut text
        // off mid-line instead of merely overflowing as it did before.
        ...(settled ? { maxHeight, overflow: "hidden" } : {}),
      }}
    >
      {text}
    </div>
  );
}
