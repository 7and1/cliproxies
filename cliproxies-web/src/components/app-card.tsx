import Link from "next/link";
import { Star, ExternalLink, Github } from "lucide-react";
import { memo } from "react";
import { App } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AppCardProps {
  app: App;
  stars?: number;
}

function AppCardInner({ app, stars }: AppCardProps) {
  return (
    <Card
      className="group relative flex h-full flex-col gap-4 border border-border/70 bg-card/70 rounded-xl glass p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/5"
      itemScope
      itemType="https://schema.org/SoftwareApplication"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors"
              itemProp="name"
            >
              {app.name}
            </h3>
            {app.isPort && (
              <Badge variant="secondary" size="sm" className="text-[10px]">
                Port
              </Badge>
            )}
            {app.featured && (
              <Badge className="text-[10px] gap-1">
                <Star className="h-2.5 w-2.5 fill-current" />
                Featured
              </Badge>
            )}
          </div>
          <p
            className="mt-2.5 text-sm text-muted-foreground leading-relaxed"
            itemProp="description"
          >
            {app.description}
          </p>
        </div>
        {stars !== undefined && (
          <div
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-primary shrink-0"
            itemProp="aggregateRating"
            itemScope
            itemType="https://schema.org/AggregateRating"
            aria-label={`${stars} stars on GitHub`}
          >
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span className="text-sm font-semibold" itemProp="ratingValue">
              {stars}
            </span>
            <meta itemProp="ratingValue" content={String(stars)} />
            <meta itemProp="bestRating" content="100000" />
            <meta itemProp="ratingCount" content="1" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {app.platforms.map((platform) => (
          <Badge key={platform} variant="secondary" size="sm">
            {platform}
          </Badge>
        ))}
        {app.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" size="sm">
            {tag}
          </Badge>
        ))}
      </div>

      <meta itemProp="operatingSystem" content={app.platforms.join(", ")} />
      <meta itemProp="applicationCategory" content="DeveloperApplication" />
      <link itemProp="url" href={app.repo} />

      <div className="mt-auto flex flex-wrap items-center gap-3 text-sm pt-2 border-t border-border/40">
        <Link
          href={app.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-label={`View ${app.name} on GitHub`}
        >
          <Github className="h-4 w-4" />
          View on GitHub
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}

export const AppCard = memo(AppCardInner, (prevProps, nextProps) => {
  return (
    prevProps.app.id === nextProps.app.id && prevProps.stars === nextProps.stars
  );
});
