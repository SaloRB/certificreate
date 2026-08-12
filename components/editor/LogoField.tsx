"use client";

import { useRef, useState } from "react";

import {
  isLogoDataUrl,
  LOGO_MIME_TYPES,
  MAX_LOGO_SIZE_LABEL,
  validateLogoFile,
} from "@/lib/brand/logo";

interface LogoFieldProps {
  value: string | null;
  onChange: (logoDataUrl: string | null) => void;
}

const READ_ERROR = "Could not read that file. Try another one.";

export function LogoField({ value, onChange }: LogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const readFile = (file: File) => {
    const check = validateLogoFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // The type and size passed, but the encoded result is what gets stored and
      // painted, so it goes through the same gate as a value from local storage.
      if (isLogoDataUrl(reader.result)) {
        setError(null);
        onChange(reader.result);
      } else {
        setError(READ_ERROR);
      }
    };
    reader.onerror = () => setError(READ_ERROR);
    reader.readAsDataURL(file);
  };

  const handleFile = (file: File | undefined) => {
    if (file) readFile(file);
    // Cleared so picking the same file again still fires a change event.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.06em] text-muted">
        Logo
      </p>

      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-field border border-field-border bg-cert-paper">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data URL has nothing for the image optimiser to fetch
            <img
              src={value}
              alt="Current logo"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-[10px] text-faint">None</span>
          )}
        </div>

        <div className="flex flex-col items-start gap-1">
          <input
            ref={inputRef}
            id="brand-logo"
            type="file"
            accept={LOGO_MIME_TYPES.join(",")}
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="max-w-full text-[11px] text-muted file:mr-2 file:cursor-pointer file:rounded-field file:border file:border-border-strong file:bg-surface-2 file:px-3 file:py-[6px] file:text-[11px] file:font-semibold file:text-text hover:file:bg-border-strong"
          />

          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            disabled={!value}
            className="text-[11px] text-muted hover:text-text disabled:invisible"
          >
            Remove logo
          </button>
        </div>
      </div>

      <p className="mt-[5px] text-[11px] text-faint">
        PNG, JPEG, WebP, or SVG, up to {MAX_LOGO_SIZE_LABEL}. Replaces the mark on
        the certificate.
      </p>

      {error ? (
        <p role="alert" className="mt-[5px] text-[11px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
