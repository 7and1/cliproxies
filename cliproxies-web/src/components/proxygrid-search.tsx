"use client";

import { useState } from "react";
import { Search as SearchIcon, Loader2, AlertCircle } from "lucide-react";
import proxygrid, { SearchResult } from "@/lib/proxygrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ProxyGridSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, SearchResult[]>>({
    google: [],
    bing: [],
    youtube: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("google");

  const handleSearch = async (engine: string) => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    // Validate query length
    if (query.length < 2) {
      setError("Query must be at least 2 characters");
      return;
    }

    if (query.length > 500) {
      setError("Query is too long (max 500 characters)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let searchResults: SearchResult[];

      switch (engine) {
        case "google":
          searchResults = await proxygrid.search.google(query);
          break;
        case "bing":
          searchResults = await proxygrid.search.bing(query);
          break;
        case "youtube":
          searchResults = await proxygrid.search.youtube(query);
          break;
        default:
          throw new Error("Unknown search engine");
      }

      setResults((prev) => ({
        ...prev,
        [engine]: searchResults,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(activeTab);
    }
  };

  const currentResults = results[activeTab] || [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search the web..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleSearch(activeTab)} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" disabled={loading}>
            Google
            {results.google.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {results.google.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bing" disabled={loading}>
            Bing
            {results.bing.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {results.bing.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="youtube" disabled={loading}>
            YouTube
            {results.youtube.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {results.youtube.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {["google", "bing", "youtube"].map((engine) => (
          <TabsContent key={engine} value={engine} className="space-y-4">
            {loading && currentResults.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {query
                  ? "No results found. Try a different search term."
                  : "Enter a search query to begin."}
              </div>
            ) : (
              <div className="space-y-4">
                {currentResults.map((result, idx) => (
                  <SearchResultItem key={idx} result={result} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SearchResultItem({ result }: { result: SearchResult }) {
  // Sanitize the result data to prevent XSS
  const sanitizedTitle = result.title
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const sanitizedSnippet = result.snippet
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return (
    <div className="p-4 rounded-lg border border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
      {result.position && (
        <Badge variant="outline" className="mb-2 text-xs">
          #{result.position}
        </Badge>
      )}
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <h3
          className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline"
          dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
        />
        <p className="text-xs text-muted-foreground truncate mb-2">
          {result.url}
        </p>
        <p
          className="text-sm text-muted-foreground line-clamp-2"
          dangerouslySetInnerHTML={{ __html: sanitizedSnippet }}
        />
      </a>
    </div>
  );
}
