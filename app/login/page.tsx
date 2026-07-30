import { signIn } from "@/lib/auth";
import { demoMode, ssoConfigured } from "@/lib/demo-mode";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">CRM-Fluent</h1>
          <p className="text-sm text-muted-foreground">
            M&amp;A sourcing and acquisition evaluation
          </p>
        </div>

        {ssoConfigured && (
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Microsoft
            </Button>
          </form>
        )}

        {ssoConfigured && demoMode && (
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        {demoMode && (
          <>
            <form
              action={async () => {
                "use server";
                await signIn("demo", { redirectTo: "/dashboard" });
              }}
            >
              <Button
                type="submit"
                variant={ssoConfigured ? "outline" : "default"}
                className="w-full"
              >
                Enter demo
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              Demo mode — no sign-in required, and anyone with this link can enter.
              Add Microsoft SSO credentials to turn this off.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
