import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Terms of Service - CLIProxies.com",
  description:
    "Terms of service for CLIProxies.com. Rules and guidelines for using our AI proxy CLI hub services and ecosystem directory.",
  keywords: [
    "terms of service",
    "Terms of use",
    "legal terms",
    "CLIProxyAPI terms",
    "open source license",
    "MIT license",
    "user agreement",
  ],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Terms of Service - CLIProxies.com",
    description:
      "Terms of service for CLIProxies.com. Rules and guidelines for using our services.",
    url: `${siteUrl}/terms`,
    type: "website",
  },
  alternates: {
    canonical: "/terms",
  },
};

const termsPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Terms of Service",
  description:
    "Terms of service for CLIProxies.com. Rules and guidelines for using our AI proxy CLI hub services.",
  url: `${siteUrl}/terms`,
  dateModified: new Date().toISOString(),
};

const termsBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Terms of Service",
      item: `${siteUrl}/terms`,
    },
  ],
};

export default function TermsPage() {
  return (
    <>
      <JsonLd data={termsPageSchema} />
      <JsonLd data={termsBreadcrumbSchema} />
      <main className="container mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground">
            By accessing and using CLIProxies.com, you accept and agree to be
            bound by these terms of service. If you do not agree to these terms,
            please do not use our website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="text-sm text-muted-foreground">
            CLIProxies.com provides documentation, configuration generation
            tools, and a directory of ecosystem apps for the CLIProxyAPI
            project. The actual proxy service runs on your own infrastructure
            using your own API keys.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
          <p className="text-sm text-muted-foreground">
            You are responsible for:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Securing your own API keys and credentials</li>
            <li>Complying with the terms of service of AI providers you use</li>
            <li>Using the proxy service in accordance with applicable laws</li>
            <li>
              Not using the service for any illegal or unauthorized purpose
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Disclaimer of Warranties</h2>
          <p className="text-sm text-muted-foreground">
            CLIProxies.com and CLIProxyAPI are provided &quot;as is&quot;
            without warranty of any kind, express or implied. We do not
            guarantee uninterrupted or error-free operation of the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground">
            In no event shall CLIProxyAPI or its contributors be liable for any
            indirect, incidental, special, consequential, or punitive damages
            arising out of your access to or use of the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Third-Party Services</h2>
          <p className="text-sm text-muted-foreground">
            Our service interacts with third-party AI providers including
            OpenAI, Anthropic, Google, and others. Your use of these services is
            governed by their respective terms of service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Open Source License</h2>
          <p className="text-sm text-muted-foreground">
            CLIProxyAPI is open source software licensed under the MIT License.
            You are free to use, modify, and distribute the software subject to
            the terms of the MIT License.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Changes to Terms</h2>
          <p className="text-sm text-muted-foreground">
            We reserve the right to modify these terms at any time. Continued
            use of the service after changes constitutes acceptance of the new
            terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Governing Law</h2>
          <p className="text-sm text-muted-foreground">
            These terms shall be governed by and construed in accordance with
            applicable laws. Any disputes shall be resolved through the
            project&apos;s GitHub issue tracker.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p className="text-sm text-muted-foreground">
            For questions about these terms, please visit our{" "}
            <Link
              href="https://github.com/CLIProxyAPI/CLIProxyAPI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub repository
            </Link>{" "}
            to open an issue.
          </p>
        </section>

        <div className="border-t border-border/60 pt-6">
          <Link
            href="/"
            className="text-sm text-primary transition-colors hover:underline"
          >
            &larr; Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
