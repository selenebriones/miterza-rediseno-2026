"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { SearchResults } from "@/lib/search-types";

export const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: SearchResults };

export function useSearch(query: string): SearchState {
  const q = query.trim();
  const [response, setResponse] = useState<{ query: string; results: SearchResults | null } | null>(null);

  useEffect(() => {
    if (q.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResponse({ query: q, results: await res.json() });
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResponse({ query: q, results: null });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  // El estado se deriva de si la última respuesta corresponde al texto actual.
  if (q.length < MIN_QUERY_LENGTH) return { status: "idle" };
  if (response?.query !== q) return { status: "loading" };
  if (!response.results) return { status: "error" };
  return { status: "done", results: response.results };
}

const RECENT_KEY = "miterza-recent-searches";
const MAX_RECENT = 5;
const NO_RECENT: string[] = [];

export function useRecentSearches() {
  const [recent, setRecent] = useLocalStorage(RECENT_KEY, NO_RECENT);

  const save = useCallback(
    (term: string) =>
      setRecent((current) =>
        [term, ...current.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT),
      ),
    [setRecent],
  );

  const clear = useCallback(() => setRecent(null), [setRecent]);

  return { recent, save, clear };
}
