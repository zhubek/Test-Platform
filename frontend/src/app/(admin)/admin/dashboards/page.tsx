"use client";

import Link from "next/link";
import { Plus, LayoutDashboard } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { contentDashboards } from "../_components/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";

export default function DashboardsPage() {
  const { t, locale } = useLocale();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("cm.dashboards.heading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aggregate analytics across results.
          </p>
        </div>
        <ButtonLink href="/admin/dashboards/new">
          <Plus className="mr-1 h-4 w-4" />
          {t("cm.dashboards.create")}
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contentDashboards.map((dash) => (
          <Link key={dash.id} href={`/admin/dashboards/${dash.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <Badge
                    variant={dash.status === "published" ? "default" : "secondary"}
                  >
                    {dash.status}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base">
                  {localize(dash.name, locale)}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {localize(dash.description, locale)}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {dash.widgets.length} widget{dash.widgets.length !== 1 && "s"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
