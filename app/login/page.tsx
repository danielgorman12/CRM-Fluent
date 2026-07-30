import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">CRM-Fluent</h1>
          <p className="text-sm text-muted-foreground">
            M&A sourcing platform — sign in with your Fluent Microsoft 365 account.
          </p>
        </div>
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
      </div>
    </div>
  );
}
