"use client";

import { use } from "react";
import { ArrowRight } from "lucide-react";
import {
  orgLicenses,
  licenseToken,
} from "@/app/(orgadmin)/org-admin/licenses/_components/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/button-link";

export default function MagicEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const license = orgLicenses.find((l) => licenseToken(l.code) === token);

  if (!license) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-semibold">Link not recognized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This access link is invalid or has expired. Ask your administrator for
          a new one.
        </p>
      </div>
    );
  }

  const who = license.name || "Student";

  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {who.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">You&apos;re signed in as</p>
            <h1 className="text-2xl font-bold tracking-tight">{who}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{license.code}</p>
          </div>
          <ButtonLink href="/tests" className="mt-2">
            Go to my tests <ArrowRight className="ml-1 h-4 w-4" />
          </ButtonLink>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Not you?{" "}
        <a href="/tests" className="underline">
          Use a different link
        </a>
      </p>
    </div>
  );
}
