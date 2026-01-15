# Apps Grid Page

## Page Component

```tsx
// app/apps/page.tsx
import { apps } from "@/data/ecosystem";
import { sponsors } from "@/data/sponsors";
import { AppCard } from "@/components/app-card";
import { SponsorCard } from "@/components/sponsor-card";

export default function AppsPage() {
  return (
    <main className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Ecosystem Apps</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Featured sponsor at top */}
        {sponsors
          .filter((s) => s.tier === "gold")
          .map((s) => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}

        {/* Featured apps */}
        {apps
          .filter((a) => a.featured)
          .map((a) => (
            <AppCard key={a.id} app={a} />
          ))}

        {/* Regular apps */}
        {apps
          .filter((a) => !a.featured)
          .map((a) => (
            <AppCard key={a.id} app={a} />
          ))}
      </div>
    </main>
  );
}
```
