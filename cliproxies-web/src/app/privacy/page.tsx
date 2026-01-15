import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cliproxies.com";

export const metadata: Metadata = {
  title: "Privacy Policy - CLIProxies.com",
  description:
    "Privacy policy for CLIProxies.com. Learn how we handle data, cookies, and your privacy. We do not collect personal information through our proxy services.",
  keywords: [
    "privacy policy",
    "data protection",
    "cookie policy",
    "CLIProxyAPI privacy",
    "GDPR compliance",
    "data collection policy",
  ],
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Privacy Policy - CLIProxies.com",
    description:
      "Privacy policy for CLIProxies.com. Learn how we handle data, cookies, and your privacy.",
    url: `${siteUrl}/privacy`,
    type: "website",
  },
  alternates: {
    canonical: "/privacy",
  },
};

const privacyPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy Policy",
  description:
    "Privacy policy for CLIProxies.com. Learn how we handle data, cookies, and your privacy.",
  url: `${siteUrl}/privacy`,
  dateModified: new Date().toISOString(),
};

const privacyBreadcrumbSchema = {
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
      name: "Privacy Policy",
      item: `${siteUrl}/privacy`,
    },
  ],
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={privacyPageSchema} />
      <JsonLd data={privacyBreadcrumbSchema} />
      <main className="container mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
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
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground">
            CLIProxies.com is a documentation and ecosystem directory website.
            We do not collect personal information through our proxy services.
            All API configurations are generated locally in your browser and
            never sent to our servers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            2. Cookies and Local Storage
          </h2>
          <p className="text-sm text-muted-foreground">
            We use essential cookies for site functionality. Your browser may
            store local preferences for platform detection. We do not use
            tracking cookies for advertising purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Third-Party Services</h2>
          <p className="text-sm text-muted-foreground">
            Our website may include links to third-party services such as
            GitHub, which have their own privacy policies. We are not
            responsible for the practices of these third parties.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Data Security</h2>
          <p className="text-sm text-muted-foreground">
            We implement appropriate security measures to protect your
            information. However, no method of transmission over the internet is
            completely secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground">
            Since we do not collect personal information, there is no personal
            data to request, modify, or delete. If you have concerns about our
            privacy practices, please contact us through our GitHub repository.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Children&apos;s Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Our service is not intended for children under 13. We do not
            knowingly collect information from children.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground">
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new policy on this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            If you have questions about this privacy policy, please visit our{" "}
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
