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
      {/* Warm content surface on the grey canvas, with a navy sidebar block. */}
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden bg-background shadow-sm sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl">
        <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
          <div className="flex items-center gap-2.5 px-3">
            <span className="grid size-7 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
              CF
            </span>
            <span className="font-heading text-[16px] font-medium tracking-tight">CRM-Fluent</span>
          </div>

          <p className="mt-8 px-3 text-[11px] font-medium uppercase tracking-wider text-cream/45">
            Sourcing
          </p>
          <div className="mt-2">
            <SidebarNav />
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-white/5 px-3 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft/20 text-[11px] font-semibold text-brand-soft">
                {initials(session?.user?.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium leading-tight">
                  {session?.user?.name ?? "Signed in"}
                </p>
                <p className="truncate text-[11px] text-cream/55">
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
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-cream/65 transition-colors hover:bg-sidebar-accent hover:text-cream"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Compact header stands in for the sidebar on small screens. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between bg-sidebar px-5 py-3 text-sidebar-foreground lg:hidden">
            <span className="font-heading text-[15px] font-medium">CRM-Fluent</span>
            <span className="text-xs text-cream/60">{session?.user?.name}</span>
          </header>
          <main className="min-w-0 flex-1 px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
