import { PublicTopbar } from "@/components/public-topbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PublicTopbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">{children}</div>
      </main>
    </div>
  );
}
