"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";

const locales = ["kz", "ru", "en"] as const;

const nav = [
  { label: "Licenses", href: "/org-admin/licenses" },
  { label: "Dashboard", href: "/org-admin/dashboard" },
];

export function OrgAdminTopbar() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-8">
        <Link href="/org-admin/licenses" className="text-lg font-bold tracking-tight">
          Test<span className="text-primary">Platform</span>
        </Link>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Org admin
        </Badge>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-muted p-0.5">
          {locales.map((lc) => (
            <button
              key={lc}
              onClick={() => setLocale(lc)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium uppercase transition-all",
                locale === lc
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {lc}
            </button>
          ))}
        </div>

        <ButtonLink variant="outline" size="sm" href="/tests">
          View site
        </ButtonLink>
      </div>
    </header>
  );
}
