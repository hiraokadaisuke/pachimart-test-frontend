"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Seller = {
  id: string;
  name: string;
  contactName?: string;
  tel?: string;
};

type SellerResponse = {
  id: string | number;
  name: string;
  contactName?: string;
  tel?: string;
};

type SellerAutocompleteProps = {
  name?: string;
  hiddenInputName?: string;
  searchApiPath?: string;
  placeholder?: string;
  initialSeller?: Seller | null;
  onSelect?: (seller: Seller) => void;
};

const DEBOUNCE_MS = 300;

export const SellerAutocomplete = ({
  name = "seller_name",
  hiddenInputName = "seller_id",
  searchApiPath = "/api/sellers/search",
  placeholder = "会社名 / 店舗名 / 会員ID / 電話番号 / 担当者名 で検索",
  initialSeller = null,
  onSelect,
}: SellerAutocompleteProps) => {
  const [keyword, setKeyword] = useState(initialSeller?.name ?? "");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(
    initialSeller?.id ? String(initialSeller.id) : null
  );
  const [results, setResults] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedKeyword = keyword.trim();

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!trimmedKeyword) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`${searchApiPath}?q=${encodeURIComponent(trimmedKeyword)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch sellers");
        }
        const data: SellerResponse[] = await response.json();
        const normalizedResults = data.map((seller) => ({
          ...seller,
          id: String(seller.id),
        }));
        setResults(normalizedResults.slice(0, 10));
        setHighlightedIndex(normalizedResults.length > 0 ? 0 : -1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setHighlightedIndex(-1);
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, [searchApiPath, trimmedKeyword]);

  const handleSelect = (seller: Seller) => {
    setKeyword(seller.name);
    setSelectedSellerId(seller.id);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect?.(seller);
  };

  const visibleResults = useMemo(() => results.slice(0, 10), [results]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= visibleResults.length ? 0 : next;
      });
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? visibleResults.length - 1 : next;
      });
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const seller = visibleResults[highlightedIndex];
      if (seller) {
        handleSelect(seller);
      }
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-[22rem] text-xs">
      <input type="hidden" name={hiddenInputName} value={selectedSellerId ?? ""} />
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        className="w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        autoComplete="off"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-64 overflow-auto">
            {isLoading && (
              <li className="px-3 py-2 text-slate-700">検索中...</li>
            )}

            {!isLoading && visibleResults.length === 0 && trimmedKeyword && (
              <li className="px-3 py-2 text-slate-700">該当する売却先がありません。</li>
            )}

            {!isLoading &&
              visibleResults.map((seller, index) => (
                <li
                  key={`${seller.id}`}
                  className={`cursor-pointer px-3 py-2 text-slate-800 hover:bg-slate-100 ${
                    highlightedIndex === index ? "bg-slate-100" : ""
                  }`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(seller);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {seller.name}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SellerAutocomplete;
