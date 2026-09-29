import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Play, RefreshCw } from "lucide-react";
import { useAlarms, useEquipment, useHistory } from "../api/queries";
import type { AlarmStatus } from "../api/models";
import { useCopilot } from "../app/copilotContext";
import { AlarmTable } from "../components/alarms/AlarmTable";
import { AssetRail } from "../components/diagnostics/AssetRail";
import { DiagnosticDrawer } from "../components/diagnostics/DiagnosticDrawer";
import { HistoryTable } from "../components/history/HistoryTable";
import { LiveTelemetry } from "../components/telemetry/LiveTelemetry";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { SelectFilter } from "../components/ui/Filters";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/States";
import { StatusLabel } from "../components/ui/StatusLabel";
import { TabPanel, Tabs } from "../components/ui/Tabs";
import { EquipmentThumbnail } from "../components/workspace/EquipmentThumbnail";
import { formatDate, formatDateTime, humanize } from "../lib/format";
import { ALARM_STATUS, assetStatus, attentionRank } from "../lib/status";
import { TriangleAlert } from "lucide-react";

const TABS = [
  { id: "live", label: "Live data" },
  { id: "faults", label: "Fault codes" },
  { id: "history", label: "History" }
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function DiagnosticsPage() {
  const { assetId, tab } = useParams();
  const navigate = useNavigate();
  const equipment = useEquipment();
  const { chat } = useCopilot();
  const [drawer, setDrawer] = useState<{ open: boolean; from: number }>({ open: false, from: 0 });
  const [alarmFilter, setAlarmFilter] = useState<AlarmStatus | "">("");
  const all = useMemo(() => equipment.data?.equipment ?? [], [equipment.data]);
  const known = useMemo(() => new Set(all.map((e) => e.machine_id)), [all]);
  const asset = all.find((e) => e.machine_id === assetId);
  const current = (TABS.find((t) => t.id === tab)?.id ?? "live") as TabId;

  const alarms = useAlarms({ machine_id: assetId, status: alarmFilter || undefined });
  const allAlarms = useAlarms({ machine_id: assetId });
  const activeAlarms = useMemo(() => (allAlarms.data ?? []).filter((a) => a.status === "active"), [allAlarms.data]);
  const history = useHistory({ machine_id: assetId, page_size: 25 });

  useEffect(() => {
    document.title = `Diagnostics${asset ? ` · ${asset.name}` : ""} · Maintenance Copilot`;
  }, [asset]);

  // No asset chosen: open the one that needs attention first
  if (!assetId && all.length) {
    const first = [...all].sort((a, b) => attentionRank(a) - attentionRank(b))[0]!;
    return <Navigate to={`/diagnostics/${first.machine_id}`} replace />;
  }

  const runDiagnostic = () => {
    if (!asset) return;
    setDrawer({ open: true, from: chat.messages.length });
    void chat.send(
      `Run a diagnostic on ${asset.name} (${asset.machine_id})`,
      `Run a diagnostic check on ${asset.name} (${asset.machine_id}, ${asset.type}, ${asset.location}, status ${asset.status}): summarize active alarms and fault codes, recent maintenance history, likely causes, and the next checks to perform.`
    );
  };

  const updated = alarms.dataUpdatedAt ? formatDateTime(new Date(alarms.dataUpdatedAt).toISOString()) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Diagnostics"
        actions={
          <>
            {updated && (
              <span className="inline-flex items-center gap-2 text-meta text-body">
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Last updated <time className="font-data">{updated}</time>
              </span>
            )}
            <Button variant="primary" icon={Play} onClick={runDiagnostic} disabled={!asset || chat.loading} loading={chat.loading && drawer.open}>
              Run diagnostic
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] wide:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <AssetRail equipment={equipment.data?.equipment} isLoading={equipment.isLoading} error={equipment.error} onRetry={() => void equipment.refetch()} tab={current} />

        <div className="min-w-0 space-y-5">
          {!asset ? (
            <Card>
              <EmptyState
                title={equipment.isLoading ? "Loading assets…" : `Asset ${assetId ?? ""} isn't in the register`}
                message={equipment.isLoading ? undefined : "Pick an asset from the list to see its sensors and fault codes."}
              />
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-start gap-5">
                  <EquipmentThumbnail machineId={asset.machine_id} name={asset.name} type={asset.type} size="lg" className="bg-panel shadow-2xs" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-heading font-bold tracking-[-0.02em]">{asset.name}</h2>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-copy text-body">
                      <span className="font-data text-ink">{asset.machine_id}</span>
                      <span aria-hidden="true">·</span>
                      {asset.location}
                    </p>
                    <p className="mt-2">
                      <StatusLabel meta={assetStatus(asset.status)} tinted />
                    </p>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-meta">
                    <dt className="text-body">Type</dt>
                    <dd className="text-ink">{asset.type}</dd>
                    <dt className="text-body">Criticality</dt>
                    <dd className="text-ink">{humanize(asset.criticality ?? "—")}</dd>
                    <dt className="text-body">Last service</dt>
                    <dd className="font-data text-ink">{formatDate(asset.last_service)}</dd>
                  </dl>
                </div>
              </Card>

              {/* Active fault summary (up to 3 rows) */}
              {activeAlarms.length > 0 && current !== "faults" && (
                <div className="p-4 rounded-[var(--radius-card)] bg-danger-bg/70 border border-danger-line space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-meta font-bold text-danger-ink">
                      <TriangleAlert className="w-4 h-4 text-danger" aria-hidden="true" />
                      Active fault {activeAlarms.length === 1 ? "code" : "codes"} requiring attention ({activeAlarms.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/diagnostics/${asset.machine_id}/faults`)}
                      className="text-meta font-semibold text-danger hover:underline cursor-pointer"
                    >
                      View all faults →
                    </button>
                  </div>
                  <ul className="space-y-1.5 divide-y divide-danger-line/60">
                    {activeAlarms.slice(0, 3).map((a) => (
                      <li key={a.alarm_id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 text-meta">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-data font-semibold text-danger-ink px-1.5 py-0.5 rounded bg-white/80 border border-danger-line/80">
                            {a.code}
                          </span>
                          <span className="text-ink truncate">{a.fault_description ?? "Fault detected"}</span>
                        </div>
                        <time className="font-data text-body shrink-0 text-label">{formatDateTime(a.triggered_at)}</time>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Tabs
                  label="Diagnostics views"
                  idBase="diag"
                  items={TABS.map((t) => ({ ...t, count: t.id === "faults" && activeAlarms.length ? activeAlarms.length : undefined }))}
                  value={current}
                  onChange={(id) => navigate(`/diagnostics/${asset.machine_id}${id === "live" ? "" : `/${id}`}`, { replace: true })}
                />
                <TabPanel idBase="diag" value={current} className="pt-5">
                  {current === "live" && <LiveTelemetry machineId={asset.machine_id} />}
                  {current === "faults" && (
                    <Card aria-labelledby="faults-heading">
                      <CardHeader
                        id="faults-heading"
                        title={alarmFilter ? `${ALARM_STATUS[alarmFilter].label} fault codes` : "Fault codes"}
                        action={
                          <SelectFilter
                            label="Fault code status"
                            allLabel="All codes"
                            value={alarmFilter}
                            onChange={(v) => setAlarmFilter(v as AlarmStatus | "")}
                            options={Object.entries(ALARM_STATUS).map(([value, m]) => ({ value, label: m.label }))}
                            className="w-44"
                          />
                        }
                      />
                      <AlarmTable alarms={alarms.data} isLoading={alarms.isLoading} error={alarms.error} onRetry={() => void alarms.refetch()} />
                    </Card>
                  )}
                  {current === "history" && (
                    <Card>
                      <HistoryTable events={history.data?.events} isLoading={history.isLoading} error={history.error} onRetry={() => void history.refetch()} showAsset={false} />
                    </Card>
                  )}
                </TabPanel>
              </div>
            </>
          )}
        </div>
      </div>

      {asset && (
        <DiagnosticDrawer open={drawer.open} onClose={() => setDrawer((d) => ({ ...d, open: false }))} asset={asset} fromIndex={drawer.from} knownAssets={known} />
      )}
    </div>
  );
}
