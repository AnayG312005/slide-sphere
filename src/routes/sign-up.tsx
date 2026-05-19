import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
  head: () => ({ meta: [{ title: "Sign up — Lumen" }] }),
});

function SignUpPage() {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="grid place-items-center w-9 h-9 rounded-full gradient-ember shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-2xl text-ink">Lumen</span>
        </Link>
        <SignUp signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
