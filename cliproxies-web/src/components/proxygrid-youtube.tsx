"use client";

import { useState } from "react";
import { Youtube, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import proxygrid, { YouTubeVideoInfo } from "@/lib/proxygrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ProxyGridYouTube() {
  const [videoId, setVideoId] = useState("");
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractVideoId = (input: string): string | null => {
    // Sanitize input first
    const sanitized = input.trim();

    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = sanitized.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const handleFetch = async () => {
    // Validate input length before processing
    if (!videoId.trim()) {
      setError("Please enter a YouTube URL or video ID");
      return;
    }

    if (videoId.length > 200) {
      setError("Input is too long");
      return;
    }

    const extractedId = extractVideoId(videoId);
    if (!extractedId) {
      setError("Invalid YouTube URL or video ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await proxygrid.video.youtubeInfo(extractedId);
      setVideoInfo(info);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch video info",
      );
      setVideoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFetch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="YouTube URL or video ID..."
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleFetch} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Fetch Info"
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {videoInfo && !loading && (
        <div className="space-y-4">
          <div className="p-6 rounded-lg border border-border/60 bg-card/40">
            {/* Title - sanitized */}
            <h2 className="text-xl font-semibold mb-4">
              {videoInfo.title
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#x27;")}
            </h2>

            {/* Thumbnail */}
            {videoInfo.thumbnail && (
              <div className="mb-4 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#x27;")}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-4">
              {videoInfo.viewCount !== undefined && (
                <div>
                  <span className="text-sm text-muted-foreground">Views: </span>
                  <span className="font-medium">
                    {videoInfo.viewCount.toLocaleString()}
                  </span>
                </div>
              )}
              {videoInfo.duration && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Duration:{" "}
                  </span>
                  <span className="font-medium">
                    {formatDuration(videoInfo.duration)}
                  </span>
                </div>
              )}
              {videoInfo.publishDate && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Published:{" "}
                  </span>
                  <span className="font-medium">
                    {new Date(videoInfo.publishDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Channel */}
            {videoInfo.channel && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {videoInfo.channel.name
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}
                </Badge>
              </div>
            )}

            {/* Description - sanitized */}
            {videoInfo.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                <p
                  className="text-sm text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: videoInfo.description
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-border/60">
              <a
                href={`https://youtube.com/watch?v=${videoInfo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Watch on YouTube
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
