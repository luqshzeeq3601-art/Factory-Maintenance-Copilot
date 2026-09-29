import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CircleAlert, Eye, EyeOff, Lock, User } from "lucide-react";
import { API_BASE } from "../../config";
import { SignInError, signIn, type AuthUser, type SignInErrorKind } from "../../api/auth";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";

// Seeded demo accounts are offered only in development or when a build opts in with VITE_DEMO_SIGNIN=true.
// Both flags are replaced at build time, so production bundles don't contain the demo passwords.
const DEMO_ACCOUNTS =
  import.meta.env.DEV || import.meta.env.VITE_DEMO_SIGNIN === "true"
    ? [
        {
          id: "supervisor1",
          label: "Supervisor",
          badgeBg: "bg-[#DBEAFE] text-[#2563EB]",
          cardBg: "bg-[#F0F6FF] border-[#BFDBFE] hover:bg-[#E0EEFE] hover:border-blue-300",
          password: "SupervisorPass123!"
        },
        {
          id: "tech1",
          label: "Technician",
          badgeBg: "bg-[#DCFCE7] text-[#16A34A]",
          cardBg: "bg-[#F0FDF4] border-[#BBF7D0] hover:bg-[#DCFCE7] hover:border-emerald-300",
          password: "TechPass123!"
        }
      ]
    : [];

export function LoginForm({ onSignedIn }: { onSignedIn: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<{ kind: SignInErrorKind | "missing"; message: string } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = async (source: string, user: string, pass: string) => {
    if (!user.trim() || !pass) {
      setError({ kind: "missing", message: "Enter your username and password." });
      return;
    }
    setError(null);
    setPending(source);
    try {
      onSignedIn(await signIn(API_BASE, user, pass));
    } catch (err) {
      const kind = err instanceof SignInError ? err.kind : "server";
      setError({ kind, message: err instanceof Error ? err.message : "Sign-in failed. Try again." });
      setPending(null);
      if (kind === "credentials" && source === "form") {
        setPassword("");
        passwordRef.current?.focus();
      }
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit("form", username, password);
  };

  const trackCapsLock = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  const invalidUser = error?.kind === "credentials" || (error?.kind === "missing" && !username.trim());
  const invalidPass = error?.kind === "credentials" || (error?.kind === "missing" && !password);
  const busy = pending !== null;

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="space-y-3.5">
        {error && (
          <p id="signin-error" role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-danger-bg text-meta font-medium text-danger-ink">
            <CircleAlert className="w-4 h-4 mt-px shrink-0 text-danger" aria-hidden="true" />
            {error.message}
          </p>
        )}
        <div className="space-y-1">
          <label htmlFor="signin-username" className="sr-only">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="signin-username"
              name="username"
              placeholder="Username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={invalidUser || undefined}
              aria-describedby={error ? "signin-error" : undefined}
              className={cn(
                "w-full h-11 pl-10 pr-3 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400",
                "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all",
                invalidUser ? "border-danger focus:ring-danger/20" : "border-slate-200"
              )}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="signin-password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              ref={passwordRef}
              id="signin-password"
              name="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={trackCapsLock}
              onKeyDown={trackCapsLock}
              aria-invalid={invalidPass || undefined}
              aria-describedby={[error ? "signin-error" : "", capsLock ? "signin-caps" : ""].filter(Boolean).join(" ") || undefined}
              className={cn(
                "w-full h-11 pl-10 pr-10 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400",
                "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB] transition-all",
                invalidPass ? "border-danger focus:ring-danger/20" : "border-slate-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          {capsLock && (
            <p id="signin-caps" className="text-meta font-medium text-warn">
              Caps Lock is on.
            </p>
          )}
        </div>
        <div className="pt-1">
          <Button type="submit" variant="primary" className="w-full h-11 rounded-xl shadow-xs bg-[#2563EB] hover:bg-[#1D4ED8] font-medium" loading={pending === "form"} disabled={busy}>
            Sign in
          </Button>
        </div>
      </form>

      {DEMO_ACCOUNTS.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            or continue as
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map(({ id, label, badgeBg, cardBg, password: pass }) => (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => void submit(id, id, pass)}
                aria-label={`Continue as ${label} (demo account ${id})`}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border cursor-pointer transition-all disabled:opacity-50",
                  cardBg
                )}
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", badgeBg)}>
                  <User className="w-4 h-4 fill-current" aria-hidden="true" />
                </div>
                <span className="text-[13px] font-semibold text-slate-800">
                  {pending === id ? "Signing in…" : label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
