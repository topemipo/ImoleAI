import { useState, useCallback } from 'react';

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  confidence: number;
}

export const useWebSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const searchWeb = useCallback(async (query: string): Promise<SearchResult[]> => {
    setIsSearching(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    searchWeb,
    isSearching,
    results,
  };
};