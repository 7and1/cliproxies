"use client";

import Link from "next/link";
import { memo } from "react";
import { useOS } from "@/hooks/use-os";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Activity,
  FileText,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const CTA_MAP = {
  mac: {
    primary: { label: "Explore Mac apps", href: "/apps?platform=mac" },
    secondary: { label: "Get config.yaml", href: "/#config" },
  },
  windows: {
    primary: { label: "Explore Windows apps", href: "/apps?platform=windows" },
    secondary: { label: "Get config.yaml", href: "/#config" },
  },
  linux: {
    primary: { label: "Explore CLI tools", href: "/apps?platform=linux" },
    secondary: { label: "Read the docs", href: "/docs" },
  },
  other: {
    primary: { label: "View ecosystem", href: "/apps" },
    secondary: { label: "Read the docs", href: "/docs" },
  },
} as const;

const featureCards = [
  {
    icon: BookOpen,
    title: "Docs",
    description:
      "Reference guides at help.router-for.me with OAuth walkthroughs.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: Activity,
    title: "Status",
    description:
      "Monitor OpenAI, Anthropic, and Google status from one dashboard.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "Config",
    description: "Download a standardized config.yaml for CLIProxyAPI.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
] as const;

function HeroSectionInner() {
  const os = useOS();
  const cta = CTA_MAP[os];

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-3xl border border-border/60 glass-strong px-6 py-12 sm:py-16 shadow-2xl shadow-black/40 md:px-10 group"
    >
      {/* Animated background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse-slow rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse-slow rounded-full bg-amber-500/10 blur-3xl [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-float" />
      </div>

      <div className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div className="space-y-6 animate-rise">
          <Badge
            variant="secondary"
            className="w-fit gap-1.5 px-3 py-1 text-xs font-medium shadow-sm"
          >
            <Sparkles className="h-3 w-3" />
            CLIProxyAPI ecosystem
          </Badge>
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
          >
            The hub for{" "}
            <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              AI proxy tooling
            </span>
            , providers, and polished client apps.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground leading-relaxed md:text-lg">
            Find production-ready clients, generate a clean config.yaml, and
            keep tabs on provider health in one place.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              asChild
              className="gap-2 group shadow-lg hover:shadow-xl transition-all btn-pulse"
            >
              <Link href={cta.primary.href}>
                {cta.primary.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="shadow-sm hover:shadow-md transition-all"
            >
              <Link href={cta.secondary.href}>{cta.secondary.label}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-muted-foreground">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group rounded-2xl border border-border/60 glass p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg ${card.bg} p-2.5 transition-colors group-hover:scale-110 group-hover:${card.bg.replace("/10", "/20")}`}
                  >
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${card.color} font-semibold`}
                    >
                      {card.title}
                    </p>
                    <p className="mt-2 text-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <a
            href="https://help.router-for.me"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-background/40 p-4 text-xs text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:bg-accent/50 hover:text-foreground hover:shadow-md"
          >
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span className="font-medium">View full documentation</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export const HeroSection = memo(HeroSectionInner);
