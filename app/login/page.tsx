import { signIn } from "@/lib/auth";
import { demoLoginEnabled, entraLoginEnabled } from "@/lib/auth.config";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const noProviders = !entraLoginEnabled && !demoLoginEnabled;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">CRM-Fluent</h1>
          <p className="text-sm text-muted-foreground">
            M&amp;A sourcing and acquisition evaluation
          </p>
        </div>

        {entraLoginEnabled && (
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

        {entraLoginEnabled && demoLoginEnabled && (
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        {demoLoginEnabled && (
          <>
            <form
              action={async () => {
                "use server";
                await signIn("demo", { redirectTo: "/dashboard" });
              }}
            >
              <Button
                type="submit"
                variant={entraLoginEnabled ? "outline" : "default"}
                className="w-full"
              >
                Continue as demo user
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              Demo access is enabled on this deployment — anyone with this link can sign in.
            </p>
          </>
        )}

        {noProviders && (
          <div className="space-y-2 rounded-md border border-dashed p-4 text-center">
            <p className="text-sm font-medium">No sign-in method configured</p>
            <p className="text-xs text-muted-foreground">
              Set the <code>AUTH_MICROSOFT_ENTRA_ID_*</code> variables for Microsoft SSO, or{" "}
              <code>ENABLE_DEMO_LOGIN=true</code> for demo access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
