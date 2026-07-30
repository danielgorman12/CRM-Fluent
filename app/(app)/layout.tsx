import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/SidebarNav";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-canvas p-0 sm:p-6">
      {/* White app surface floating on the gray canvas. */}
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden bg-background sm:min-h-[calc(100vh-3rem)] sm:rounded-xl sm:shadow-sm">
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
          <div className="flex items-center gap-2.5 px-3">
            <span className="grid size-7 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
              CF
            </span>
            <span className="text-[15px] font-semibold tracking-tight">CRM-Fluent</span>
          </div>

          <p className="mt-8 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sourcing
          </p>
          <div className="mt-2">
            <SidebarNav />
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-chart-1/15 text-[11px] font-semibold text-chart-1">
                {initials(session?.user?.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium leading-tight">
                  {session?.user?.name ?? "Signed in"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {session?.user?.title ?? session?.user?.email}
                </p>
              </div>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Compact header stands in for the sidebar on small screens. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b px-5 py-3 lg:hidden">
            <span className="text-sm font-semibold">CRM-Fluent</span>
            <span className="text-xs text-muted-foreground">{session?.user?.name}</span>
          </header>
          <main className="min-w-0 flex-1 px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
