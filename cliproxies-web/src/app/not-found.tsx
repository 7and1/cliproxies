import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Grid3x3, Search, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

const notFoundSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Page Not Found",
  description: "The page you are looking for does not exist or has been moved.",
  url: `${siteUrl}/404`,
};

export default function NotFound() {
  return (
    <>
      <JsonLd data={notFoundSchema} />
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 sm:px-6 py-20">
        <div className="text-center animate-fade-in max-w-lg">
          <div className="mb-8 inline-flex">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-slow rounded-full bg-primary/20 blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-amber-500/10 rounded-full blur-xl animate-float" />
              <span className="relative text-[8rem] sm:text-[10rem] font-bold leading-none bg-gradient-to-br from-primary/30 to-amber-500/20 bg-clip-text text-transparent">
                404
              </span>
            </div>
          </div>
          <h1 className="mb-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Page not found
          </h1>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground leading-relaxed">
            The route you requested does not exist. The page may have been moved
            or deleted.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 w-full max-w-sm animate-slide-up">
          <Button
            asChild
            className="gap-2 shadow-lg hover:shadow-xl transition-all min-h-[48px]"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="gap-2 shadow-sm hover:shadow-md transition-all min-h-[48px]"
          >
            <Link href="/apps">
              <Grid3x3 className="h-4 w-4" />
              Browse apps
            </Link>
          </Button>
        </div>

        <div
          className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <Search className="h-4 w-4" />
          <span>Looking for something specific? Try the</span>
          <Link
            href="/apps"
            className="inline-flex items-center gap-1 text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            apps directory
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </main>
    </>
  );
}
