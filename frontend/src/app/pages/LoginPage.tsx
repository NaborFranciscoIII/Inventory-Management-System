import { FormEvent, useState } from "react";
import { Boxes, LockKeyhole, LogIn } from "lucide-react";
import { login, sessionStore, type AuthSession } from "../services/backend";

type LoginPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login(email.trim(), password);
      sessionStore.save(session.sessionToken);
      onAuthenticated(session);
    } catch (reason) {
      setError(String(reason).replace(/^Error:\s*/, "") || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <section className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-7 sm:p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Boxes size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">StockWise</h1>
            <p className="text-xs text-muted-foreground">Inventory Management</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access your local workspace.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="block text-xs font-medium text-foreground mb-1.5">Email address</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-foreground mb-1.5">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </label>

          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LockKeyhole size={15} /> : <LogIn size={15} />}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">This desktop app stores its data only on this computer.</p>
      </section>
    </main>
  );
}
