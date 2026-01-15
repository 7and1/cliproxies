"use client";

import { useState, useCallback, memo } from "react";
import Image from "next/image";
import { Sponsor } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";

interface SponsorCardProps {
  sponsor: Sponsor;
}

function SponsorCardInner({ sponsor }: SponsorCardProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!sponsor.coupon) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sponsor.coupon);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = sponsor.coupon;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    }
  }, [sponsor.coupon]);

  return (
    <div className="group relative flex h-full flex-col gap-4 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground shadow-sm">
        Sponsored
      </Badge>
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-background border border-border/50 shadow-sm group-hover:shadow-md transition-shadow">
          <Image
            src={sponsor.logo}
            alt={sponsor.name}
            fill
            sizes="56px"
            className="object-contain p-2"
          />
        </div>
        <div className="flex-1">
          <p className="text-base font-bold group-hover:text-primary transition-colors">
            {sponsor.name}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {sponsor.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {sponsor.discount && (
          <Badge variant="success" className="gap-1">
            {sponsor.discount} off
          </Badge>
        )}
        {sponsor.coupon && (
          <code className="rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground font-mono">
            Code: {sponsor.coupon}
          </code>
        )}
      </div>
      <div className="mt-auto flex flex-wrap gap-3">
        <Button asChild className="flex-1 min-h-[44px]">
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2"
          >
            Visit sponsor
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        {sponsor.coupon && (
          <Button
            variant="outline"
            onClick={handleCopy}
            className="min-h-[44px] min-w-[44px] px-4"
            aria-label={copied ? "Code copied" : "Copy discount code"}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : copyError ? (
              "Failed"
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export const SponsorCard = memo(SponsorCardInner);
