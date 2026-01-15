"use client";

import { useState, useEffect } from "react";
import {
  Building,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  User,
  Clock,
} from "lucide-react";
import proxygrid, {
  HackerNewsStory,
  HackerNewsStoryType,
} from "@/lib/proxygrid";
import { Button } from "@/components/ui/button";

const STORY_TYPES: { value: HackerNewsStoryType; label: string }[] = [
  { value: "top", label: "Top Stories" },
  { value: "new", label: "New Stories" },
  { value: "best", label: "Best Stories" },
  { value: "ask", label: "Ask HN" },
  { value: "show", label: "Show HN" },
  { value: "jobs", label: "Jobs" },
];

export function ProxyGridHackerNews() {
  const [storyType, setStoryType] = useState<HackerNewsStoryType>("top");
  const [stories, setStories] = useState<HackerNewsStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await proxygrid.content.hackernews(storyType);
        setStories(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch stories",
        );
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, [storyType]);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await proxygrid.content.hackernews(storyType);
      setStories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stories");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  };

  const getStoryUrl = (story: HackerNewsStory): string => {
    return story.url || `https://news.ycombinator.com/item?id=${story.id}`;
  };

  const getHnUrl = (story: HackerNewsStory): string => {
    return `https://news.ycombinator.com/item?id=${story.id}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with story type selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">HackerNews</h2>
        </div>
        <div className="flex gap-2">
          {STORY_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={storyType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStoryType(type.value)}
              disabled={loading}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && stories.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Stories List */}
      <div className="space-y-2">
        {stories.map((story, idx) => (
          <StoryItem
            key={story.id}
            story={story}
            rank={idx + 1}
            formatTimeAgo={formatTimeAgo}
            getStoryUrl={getStoryUrl}
            getHnUrl={getHnUrl}
          />
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={fetchStories}
          disabled={loading}
          size="sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}

function StoryItem({
  story,
  rank,
  formatTimeAgo,
  getStoryUrl,
  getHnUrl,
}: {
  story: HackerNewsStory;
  rank: number;
  formatTimeAgo: (ts: number) => string;
  getStoryUrl: (story: HackerNewsStory) => string;
  getHnUrl: (story: HackerNewsStory) => string;
}) {
  // Sanitize story title to prevent XSS
  const sanitizedTitle = story.title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  // Sanitize username
  const sanitizedBy = story.by.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-card/60 transition-colors group">
      {/* Rank */}
      <span className="text-sm font-medium text-muted-foreground w-6 flex-shrink-0">
        {rank}.
      </span>

      {/* Vote arrow */}
      <div className="flex-shrink-0">
        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={getStoryUrl(story)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline line-clamp-1"
          dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
        />

        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {sanitizedBy}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(story.time)}
          </span>
          {story.score && <span>{story.score} points</span>}
          {story.descendants !== undefined && story.descendants > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {story.descendants} comments
            </span>
          )}
        </div>
      </div>

      {/* External Link */}
      {story.url && (
        <a
          href={getHnUrl(story)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
