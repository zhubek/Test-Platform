"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, FolderKanban, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { useProject, projectLanguages } from "@/lib/project-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/button-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

const nav: NavItem[] = [
  { label: "Tests", href: "/admin/tests" },
  { label: "Blocks", href: "/admin/blocks" },
  { label: "Catalogs", href: "/admin/catalogs" },
  {
    label: "Access",
    children: [
      { label: "Users", href: "/admin/users" },
      { label: "Organizations", href: "/admin/organizations" },
      { label: "Licenses", href: "/admin/licenses" },
    ],
  },
  { label: "Dashboards", href: "/admin/dashboards" },
  { label: "Parameters", href: "/admin/parameters" },
];

export function AdminTopbar() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const { projects, project, setProjectId } = useProject();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
        <Link href="/admin/tests" className="text-lg font-bold tracking-tight">
          Test<span className="text-primary">Platform</span>
        </Link>

        {/* Project picker */}
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <span className="max-w-[140px] truncate">{localize(project.name, locale)}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Switch project
            </div>
            <DropdownMenuSeparator />
            {projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setProjectId(p.id)}
                className="flex items-start gap-2"
              >
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    p.id === project.id ? "opacity-100 text-primary" : "opacity-0",
                  )}
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{localize(p.name, locale)}</span>
                  {localize(p.description, locale) && (
                    <span className="text-xs text-muted-foreground">
                      {localize(p.description, locale)}
                    </span>
                  )}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-5 w-px bg-border" />

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((item) => {
            if ("children" in item) {
              const active = item.children.some((c) => pathname.startsWith(c.href));
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((c) => (
                      <DropdownMenuItem key={c.href} render={<Link href={c.href} />}>
                        {c.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-muted p-0.5">
          {projectLanguages(project).map((lc) => (
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
