"use client";

import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Suggestion = {
  id: string;
  title: string;
  reward: number;
  categoryName: string;
};

export function AutocompleteSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let active = true;
    setLoading(true);
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jobs/autocomplete?q=${encodeURIComponent(value)}`);
        if (res.ok && active) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch {}
      if (active) setLoading(false);
    }, 200);

    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[highlightedIndex];
      navigate({ name: "job", id: suggestion.id } as Route);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        placeholder={placeholder || t.autocomplete.placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        className="pl-9"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto animate-fade-in-up">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-2">{t.autocomplete.searching}</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {t.autocomplete.noResults}
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onClick={() => {
                    navigate({ name: "job", id: s.id } as Route);
                    setShowSuggestions(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                    i === highlightedIndex ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.categoryName}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">
                    {t.common.currency}{formatMoney(s.reward, lang)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
