import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { TopBar } from "@/components/nav/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <SidebarNav user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
