"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "/", description: "Overview" },
  { label: "Apps", href: "/apps", description: "Explore tools" },
  { label: "Resources", href: "/resources", description: "View resources" },
  { label: "Status", href: "/status", description: "Provider health" },
  { label: "Docs", href: "/docs", description: "Documentation" },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/60 glass-strong transition-all duration-300 ${
        scrolled ? "shadow-lg shadow-black/20" : ""
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-opacity hover:opacity-80"
          aria-label="CLIProxies home"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm animate-pulse-slow" />
            <span className="relative text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              CLIProxies
            </span>
          </div>
          <span className="hidden sm:inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            hub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 text-sm text-muted-foreground md:flex"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 transition-all duration-200 hover:text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              aria-label={item.description}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex shadow-sm hover:shadow-md transition-all"
            asChild
          >
            <Link
              href="/apps"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Explore ecosystem
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <nav
          className="container mx-auto flex flex-col px-6 py-4 gap-1 border-t border-border/40"
          aria-label="Mobile navigation"
        >
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ transitionDelay: isOpen ? `${index * 50}ms` : "0ms" }}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </Link>
          ))}
          <Button
            variant="outline"
            className="mt-4 w-full min-h-[48px]"
            asChild
            onClick={closeMenu}
          >
            <Link href="/apps">Explore ecosystem</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
