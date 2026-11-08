"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export type Option = { value: string; label: string };

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
  emptyText = "No matches",
}: {
  options: Option[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent/50"
        onClick={() => {
          setOpen(!open);
          setQuery("");
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected?.label ?? placeholder ?? "Select"}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1.5">
            <Input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-8"
            />
          </div>
          <div role="listbox" className="max-h-48 overflow-y-auto pb-1">
            {filtered.map((o) => (
              <div
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                className={`cursor-pointer px-3 py-1.5 text-sm hover:bg-accent ${o.value === value ? "bg-accent" : ""}`}
                onClick={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
