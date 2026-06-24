"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, FolderKanban, ChevronDown, LogOut, Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { useProject, projectLanguages } from "@/lib/project-context";
import { useAdminAuth } from "@/lib/admin-auth";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NavItem =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

// Labels are i18n keys, resolved via t() at render.
const baseNav: NavItem[] = [
  { label: "admin.nav.tests", href: "/admin/tests" },
  { label: "admin.nav.blocks", href: "/admin/blocks" },
  { label: "admin.nav.catalogs", href: "/admin/catalogs" },
  {
    label: "admin.nav.access",
    children: [
      { label: "admin.nav.users", href: "/admin/users" },
      { label: "admin.nav.organizations", href: "/admin/organizations" },
      { label: "admin.nav.licenses", href: "/admin/licenses" },
    ],
  },
  { label: "admin.nav.dashboards", href: "/admin/dashboards" },
  { label: "admin.nav.parameters", href: "/admin/parameters" },
];

export function AdminTopbar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const { projects, project, setProjectId, addProject } = useProject();
  const { me, signOut } = useAdminAuth();

  // "New project" dialog (super-admin only — projects are platform-level).
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  const createNewProject = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setNewError(null);
    try {
      await addProject({ name });
      setNewOpen(false);
      setNewName("");
    } catch (e) {
      setNewError(e instanceof Error ? e.message.replace(/^POST .*?: /, "") : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  // Project admins get the same admin UI minus Access→Users (super-admin only).
  const nav: NavItem[] = me.isSuper
    ? baseNav
    : baseNav.map((item) =>
        "children" in item
          ? { ...item, children: item.children.filter((c) => c.href !== "/admin/users") }
          : item,
      );

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
            <span className="max-w-[140px] truncate">
              {projects.length === 0 ? t("admin.topbar.noProjects") : localize(project.name, locale)}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              {t("admin.topbar.switchProject")}
            </div>
            <DropdownMenuSeparator />
            {projects.length === 0 && (
              <div className="px-2 py-2 text-xs text-muted-foreground">{t("admin.topbar.noProjectsYet")}</div>
            )}
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
            {me.isSuper && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setNewOpen(true)} className="gap-2 text-primary">
                  <Plus className="h-4 w-4" /> {t("admin.project.new")}
                </DropdownMenuItem>
              </>
            )}
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
                    {t(item.label)}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((c) => (
                      <DropdownMenuItem key={c.href} render={<Link href={c.href} />}>
                        {t(c.label)}
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
                {t(item.label)}
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
          {t("admin.topbar.viewSite")}
        </ButtonLink>
        <span className="hidden text-xs text-muted-foreground sm:inline" title={me.login}>
          {me.name || me.login}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={signOut} title={t("admin.topbar.signOut")} aria-label={t("admin.topbar.signOut")}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.project.new")}</DialogTitle>
            <DialogDescription>{t("admin.project.newDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder={t("admin.project.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) void createNewProject();
              }}
            />
            {newError && <p className="text-sm text-red-500">{newError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)} disabled={creating}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={createNewProject} disabled={creating || !newName.trim()}>
              {creating ? t("admin.project.creating") : t("admin.project.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
