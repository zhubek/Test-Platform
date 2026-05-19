import type { Metadata } from "next";
import { CmTopbar } from "@/components/cm-topbar";

export const metadata: Metadata = {
  title: "ProfWise Admin",
  description: "Admin dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <CmTopbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
