import { useEffect } from "react";
import { NavLink, Navigate, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, Monitor, Plug, Server, UserRound, Users, type LucideIcon } from "lucide-react";
import { API_BASE } from "../config";
import { signOut } from "../api/auth";
import { api } from "../api/client";
import { useProfile } from "../api/queries";
import { useCurrentUser, useSessionContext } from "../app/sessionContext";
import { ProfileForm } from "../components/settings/ProfileForm";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { cn } from "../lib/cn";

interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Not built yet: listed for admins, but not a link. */
  comingSoon?: boolean;
}

const SECTIONS: Section[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Monitor },
  { id: "system", label: "System", icon: Server },
  { id: "users", label: "Users & roles", icon: Users, adminOnly: true, comingSoon: true },
  { id: "integrations", label: "Integrations", icon: Plug, adminOnly: true, comingSoon: true }
];

export default function SettingsPage() {
  const { section = "profile" } = useParams();
  const user = useCurrentUser();
  const isAdmin = user.role === "admin";
  const visible = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const current = visible.find((s) => s.id === section && !s.comingSoon);

  useEffect(() => {
    document.title = "Settings · Maintenance Copilot";
  }, []);

  if (!current) return <Navigate to="/settings/profile" replace />;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" />
      <Card className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)] overflow-hidden">
        <nav aria-label="Settings sections" className="p-3 border-b md:border-b-0 md:border-r border-line">
          <ul className="flex md:flex-col gap-1 overflow-x-auto custom-scrollbar">
            {visible.map((s) => (
              <li key={s.id} className="shrink-0">
                {s.comingSoon ? (
                  <span className="flex items-center gap-3 h-11 px-3 text-small text-body" aria-disabled="true">
                    <s.icon className="w-5 h-5 text-subtle" strokeWidth={1.75} aria-hidden="true" />
                    {s.label}
                    <span className="ml-auto text-label text-muted">Coming soon</span>
                  </span>
                ) : (
                  <NavLink
                    to={`/settings/${s.id}`}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-3 h-11 px-3 rounded-[var(--radius-control)] text-small whitespace-nowrap",
                        isActive
                          ? "bg-accent-bg text-accent-ink font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r before:bg-accent"
                          : "text-body font-medium hover:bg-wash hover:text-ink"
                      )
                    }
                  >
                    <s.icon className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    {s.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <section aria-labelledby="settings-section-title" className="p-6 md:p-8 min-w-0">
          <h2 id="settings-section-title" className="text-section font-semibold">
            {current.label}
          </h2>
          <div className="mt-6 max-w-[1080px]">
            {current.id === "profile" && <ProfileSection isAdmin={isAdmin} />}
            {current.id === "notifications" && (
              <EmptyState
                icon={Bell}
                title="No notification settings yet"
                message="Alarms and work orders waiting for your approval show in the app as they happen. Email and push delivery aren't configurable yet."
              />
            )}
            {current.id === "appearance" && (
              <p className="text-copy text-body max-w-[60ch]">
                The interface uses one light theme, sized for Full HD plant-floor displays. Text size follows your browser's zoom setting.
              </p>
            )}
            {current.id === "system" && <SystemSection isAdmin={isAdmin} />}
          </div>
        </section>
      </Card>
    </div>
  );
}

function ProfileSection({ isAdmin }: { isAdmin: boolean }) {
  const profile = useProfile();
  const session = useSessionContext();
  const navigate = useNavigate();
  if (profile.error) return <ErrorState title="Your profile didn't load" message={profile.error.message} onRetry={() => void profile.refetch()} />;
  if (!profile.data) return <Skeleton className="h-80" />;
  return (
    <div className="space-y-10">
      <ProfileForm key={profile.data.user_id} profile={profile.data} canEditRole={isAdmin} />
      <section aria-labelledby="session-heading" className="pt-6 border-t border-line">
        <h3 id="session-heading" className="text-title font-semibold">
          Session
        </h3>
        <p className="mt-1 mb-3 text-meta text-body">Sign out of Maintenance Copilot on this device.</p>
        <Button
          variant="danger-outline"
          icon={LogOut}
          onClick={async () => {
            await signOut(API_BASE);
            session.signedOut();
            navigate("/login", { replace: true });
          }}
        >
          Sign out
        </Button>
      </section>
    </div>
  );
}

function SystemSection({ isAdmin }: { isAdmin: boolean }) {
  const health = useQuery({
    queryKey: ["system-stats"],
    queryFn: ({ signal }) => api<Record<string, string | number>>("/api/stats", { signal }),
    enabled: isAdmin
  });
  if (!isAdmin) return <p className="text-copy text-body">System details are available to administrators.</p>;
  if (health.error) return <ErrorState title="The service health check failed" message={health.error.message} onRetry={() => void health.refetch()} />;
  if (!health.data) return <Skeleton className="h-32" />;
  return (
    <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-3 text-meta">
      {Object.entries(health.data).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-body capitalize">{k.replace(/_/g, " ")}</dt>
          <dd className="font-data text-ink break-all">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
