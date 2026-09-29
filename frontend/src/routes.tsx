import { lazy, type ReactNode } from "react";
import { Navigate, useLocation, type RouteObject } from "react-router";
import { useSessionContext } from "./app/sessionContext";
import { AppShell } from "./components/shell/AppShell";
import { PageSkeleton } from "./components/shell/PageSkeleton";
import { LoginPage } from "./pages/LoginPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const AssetDetailPage = lazy(() => import("./pages/AssetDetailPage"));
const DiagnosticsPage = lazy(() => import("./pages/DiagnosticsPage"));
const SopsPage = lazy(() => import("./pages/SopsPage"));
const WorkOrdersPage = lazy(() => import("./pages/WorkOrdersPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

/** Pages behind sign-in. Waits for the session check so a signed-in user never sees the login flash. */
function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser, checked } = useSessionContext();
  const location = useLocation();
  if (!checked) {
    return (
      <div className="p-6">
        <PageSkeleton />
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Links from the single-page UI (`?view=dashboard`, `?asset=EQ-1000&tab=sops`) still land somewhere sensible. */
function LegacyRedirect({ children }: { children: ReactNode }) {
  const params = new URLSearchParams(useLocation().search);
  const view = params.get("view");
  const asset = params.get("asset");
  if (view === "approvals") return <Navigate to="/work-orders?status=approval" replace />;
  if (view === "workspace" || asset) return <Navigate to={asset ? `/assets/${encodeURIComponent(asset)}` : "/assets"} replace />;
  return children;
}

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <LegacyRedirect>
            <DashboardPage />
          </LegacyRedirect>
        )
      },
      { path: "assets", element: <AssetsPage /> },
      { path: "assets/:assetId/:tab?", element: <AssetDetailPage /> },
      { path: "diagnostics/:assetId?/:tab?", element: <DiagnosticsPage /> },
      { path: "sops", element: <SopsPage /> },
      { path: "work-orders/:workOrderId?", element: <WorkOrdersPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "settings", element: <Navigate to="/settings/profile" replace /> },
      { path: "settings/:section", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/" replace /> }
    ]
  }
];
