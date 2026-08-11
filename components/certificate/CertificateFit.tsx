"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { CERT_WIDTH_PX } from "@/types/certificate";

interface CertificateFitProps {
  children: ReactNode;
  className?: string;
}

/** Scales the fixed-size certificate down to the width it is given. Measured in
 *  JS because no CSS expression for it works in all three engines: see the note
 *  on `.cert-fit` in globals.css. */
export function CertificateFit({ children, className }: CertificateFitProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / CERT_WIDTH_PX));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `cert-fit ${className}` : "cert-fit"}
      style={{ "--cert-scale": scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
