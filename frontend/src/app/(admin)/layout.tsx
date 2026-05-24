import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin-topbar";
import { ProjectProvider } from "@/lib/project-context";

export const metadata: Metadata = {
  title: "Test-Platform Admin",
  description: "Admin dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <AdminTopbar />
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </ProjectProvider>
  );
}
