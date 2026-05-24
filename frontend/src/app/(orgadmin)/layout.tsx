import type { Metadata } from "next";
import { OrgAdminTopbar } from "@/components/orgadmin-topbar";

export const metadata: Metadata = {
  title: "Test-Platform Org Admin",
  description: "Organization admin",
};

export default function OrgAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <OrgAdminTopbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
