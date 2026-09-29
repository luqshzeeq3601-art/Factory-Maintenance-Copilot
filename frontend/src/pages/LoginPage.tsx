import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, type Location } from "react-router";
import { Clock, FileText, ShieldCheck, TrendingUp, Wrench } from "lucide-react";
import { useSessionContext } from "../app/sessionContext";
import { ProductMark } from "../components/auth/SignInArt";
import { LoginForm } from "../components/auth/LoginForm";

const BENEFITS = [
  { icon: TrendingUp, label: "Real-time asset monitoring" },
  { icon: Wrench, label: "AI-assisted diagnostics" },
  { icon: FileText, label: "Work order management" },
  { icon: ShieldCheck, label: "Safer and more efficient operations" }
];

/**
 * Photorealistic industrial login view matching the reference design:
 * Landscape framed card, industrial processing plant backdrop, left pitch overlay,
 * and elevated right sign-in modal card.
 */
export function LoginPage() {
  const session = useSessionContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const target = from ? `${from.pathname}${from.search}` : "/";

  useEffect(() => {
    document.title = "Sign in · Maintenance Copilot";
  }, []);

  if (session.currentUser) return <Navigate to={target} replace />;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16 overflow-x-hidden">
      {/* Full-bleed photorealistic plant backdrop */}
      <img
        src="/images/plant_factory_backdrop.jpg"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
      />

      {/* Subtle readability gradient for the left text against sky and structures */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent pointer-events-none lg:w-3/5"
      />

      {/* Main content wrapper spanning across the screen */}
      <div className="relative z-10 w-full max-w-[1360px] flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-12">
        {/* Left industrial showcase panel (desktop landscape) */}
        <section
          aria-labelledby="login-pitch"
          className="relative z-10 hidden lg:flex flex-col justify-between lg:max-w-[560px] xl:max-w-[620px] py-4"
        >
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <ProductMark className="w-9 h-9" />
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 drop-shadow-xs">
              Maintenance Copilot
            </span>
          </div>

          {/* Center Pitch Content */}
          <div className="my-8 lg:my-10">
            <h2
              id="login-pitch"
              className="text-4xl xl:text-[46px] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.14]"
            >
              Smarter
              <br />
              Maintenance
              <br />
              for Reliable Operations
            </h2>
            <p className="mt-4 text-base xl:text-lg text-slate-600 font-normal leading-relaxed max-w-[480px]">
              Monitor assets, diagnose issues,
              <br className="hidden sm:inline" /> and streamline maintenance.
            </p>

            {/* 4 Feature Badges */}
            <ul className="mt-8 space-y-4">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="text-slate-800 font-medium text-[15px] sm:text-base leading-snug">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Right dedicated floating sign-in card */}
        <section
          aria-labelledby="signin-title"
          className="relative z-10 w-full max-w-[360px] sm:max-w-[420px] lg:w-[410px] xl:w-[430px] p-6 sm:p-8 bg-white/95 backdrop-blur-md border border-white/80 rounded-[24px] shadow-2xl shadow-slate-900/15 shrink-0"
        >
          {/* Brand mark on card header */}
          <div className="flex items-center gap-2 mb-4">
            <ProductMark className="w-6 h-6" />
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Maintenance Copilot
            </span>
          </div>

          <h1 id="signin-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p className="mt-1 mb-5 text-[13px] text-slate-500">Access your account</p>

          {session.expired && (
            <p
              role="status"
              className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-warn-bg text-meta font-medium text-warn-ink"
            >
              <Clock className="w-4 h-4 mt-px shrink-0 text-warn" aria-hidden="true" />
              Your session expired. Sign in again to continue where you left off.
            </p>
          )}

          <LoginForm
            onSignedIn={(user) => {
              session.signedIn(user);
              navigate(target, { replace: true });
            }}
          />
        </section>
      </div>
    </div>
  );
}

