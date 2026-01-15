"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface HackerNewsItem {
  id: number;
  title: string;
  url: string | null;
  score: number;
  by: string;
  time: number;
  descendants: number;
}

interface RedditItem {
  id: string;
  title: string;
  url: string;
  score: number;
  numComments: number;
  subreddit: string;
  created: number;
}

interface YouTubeItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  viewCount: number;
  channel: string;
}

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
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

export function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<
    "hackernews" | "youtube" | "search"
  >("hackernews");
  const [hackerNewsData, setHackerNewsData] = useState<HackerNewsItem[]>([]);
  const [youTubeData, setYouTubeData] = useState<YouTubeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (showRefreshLoader = false) => {
    if (!showRefreshLoader) setLoading(true);
    setError(null);

    try {
      // Fetch HackerNews stories
      if (activeTab === "hackernews") {
        const hnResponse = await fetch(
          "/api/proxygrid/content/hackernews?type=top",
          {
            next: { revalidate: 900 }, // 15 minutes
          },
        );
        if (!hnResponse.ok) throw new Error("Failed to fetch HackerNews data");
        const hnData = await hnResponse.json();
        setHackerNewsData(hnData.slice(0, 5));
      }

      // Fetch YouTube videos
      if (activeTab === "youtube") {
        const ytResponse = await fetch(
          "/api/proxygrid/search/youtube?q=Claude%20Code%20proxy%20CLI",
          {
            next: { revalidate: 3600 }, // 1 hour
          },
        );
        if (!ytResponse.ok) throw new Error("Failed to fetch YouTube data");
        const ytData = await ytResponse.json();
        setYouTubeData(ytData.slice(0, 5));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleRefresh = () => {
    fetchData(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Community Feed</h2>
          <p className="text-sm text-muted-foreground">
            Real-time discussions and content from the AI proxy community
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="hackernews" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            HackerNews
          </TabsTrigger>
          <TabsTrigger value="youtube" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            YouTube
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hackernews" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {error}. Try again later.
              </CardContent>
            </Card>
          ) : hackerNewsData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No stories available at the moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {hackerNewsData.map((item) => (
                <Card
                  key={item.id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <a
                          href={
                            item.url ||
                            `https://news.ycombinator.com/item?id=${item.id}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary hover:underline line-clamp-2"
                        >
                          {item.title}
                        </a>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{item.score} points</span>
                          <span>by {item.by}</span>
                          <span>{formatTimeAgo(item.time)}</span>
                          {item.descendants > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {item.descendants} comments
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        HN
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="youtube" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {error}. Try again later.
              </CardContent>
            </Card>
          ) : youTubeData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No videos available at the moment.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {youTubeData.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                          <ExternalLink className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.channel}</span>
                        <span>
                          {new Intl.NumberFormat().format(item.viewCount)} views
                        </span>
                      </div>
                    </CardContent>
                  </a>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
