import { useEffect, useMemo, useState } from "react";
import { Box, CircleCheck, Octagon, PowerOff, SearchX } from "lucide-react";
import { useEquipment } from "../api/queries";
import type { Equipment } from "../api/models";
import { useCopilot } from "../app/copilotContext";
import { AssetTable } from "../components/assets/AssetTable";
import { CopilotPanel } from "../components/copilot/CopilotPanel";
import { Card } from "../components/ui/Card";
import { ResetButton, SearchInput, SelectFilter } from "../components/ui/Filters";
import { KpiTile } from "../components/ui/KpiTile";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/States";
import { useUrlFilters } from "../hooks/useUrlFilters";
import { ASSET_STATUS, assetStatus, attentionRank } from "../lib/status";

const FILTER_KEYS = ["q", "status", "location", "type", "sort", "order"] as const;
const PAGE_SIZE = 10;
const COPILOT_KEY = "copilot-collapsed";

type SortField = "name" | "machine_id" | "location" | "operating_hours" | "status" | "next_service_in_hours";

function compare(a: Equipment, b: Equipment, field: SortField): number {
  if (field === "status") return attentionRank(a) - attentionRank(b);
  const x = a[field] ?? Number.POSITIVE_INFINITY;
  const y = b[field] ?? Number.POSITIVE_INFINITY;
  return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
}

const readCollapsed = () => {
  try {
    return localStorage.getItem(COPILOT_KEY) === "1";
  } catch {
    return false;
  }
};

export default function AssetsPage() {
  const equipment = useEquipment();
  const { chat } = useCopilot();
  const { values, set, reset, page } = useUrlFilters(FILTER_KEYS);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    document.title = "Assets · Maintenance Copilot";
  }, []);

  const all = useMemo(() => equipment.data?.equipment ?? [], [equipment.data]);
  const count = (status: string) => all.filter((e) => e.status.toLowerCase() === status).length;
  const locations = useMemo(() => [...new Set(all.map((e) => e.location))].sort(), [all]);
  const types = useMemo(() => [...new Set(all.map((e) => e.type))].sort(), [all]);
  const knownAssets = useMemo(() => new Set(all.map((e) => e.machine_id)), [all]);

  const sortField = (values.sort || "status") as SortField;
  const order = values.order === "desc" ? "desc" : "asc";
  const filtered = useMemo(() => {
    const q = values.q.trim().toLowerCase();
    return all
      .filter(
        (e) =>
          (!q || [e.name, e.machine_id, e.location, e.type].some((f) => f.toLowerCase().includes(q))) &&
          (!values.status || e.status.toLowerCase() === values.status) &&
          (!values.location || e.location === values.location) &&
          (!values.type || e.type === values.type)
      )
      .sort((a, b) => (order === "asc" ? 1 : -1) * compare(a, b, sortField));
  }, [all, values, sortField, order]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtering = !!(values.q || values.status || values.location || values.type);

  const prompts = useMemo(() => {
    const fault = all.find((e) => e.status === "fault");
    const due = [...all].filter((e) => e.next_service_in_hours != null).sort((a, b) => a.next_service_in_hours! - b.next_service_in_hours!)[0];
    return [
      "Show assets in fault",
      due ? `When is the next service for ${due.name}?` : "Which assets are due for service?",
      fault ? `Show open work orders for ${fault.name}` : "Show open work orders",
      "What is the spindle bearing replacement procedure?"
    ];
  }, [all]);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COPILOT_KEY, c ? "0" : "1");
      } catch {
        // Preference only; ignore blocked storage
      }
      return !c;
    });

  const total = all.length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}% of total` : undefined);
  const loading = equipment.isLoading;

  return (
    <div className="grid gap-6 wide:grid-cols-[minmax(0,1fr)_340px] wide-assets:grid-cols-[minmax(0,73%)_minmax(0,27%)] wide:items-start">
      <div className="min-w-0 space-y-5">
        <PageHeader title="Assets" subtitle="Plant equipment, condition, and service status." />

        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <KpiTile icon={Box} label="Total assets" loading={loading} value={total} context="Registered in this plant" />
          <KpiTile icon={CircleCheck} label="Running" loading={loading} value={count("operational")} context={pct(count("operational"))} />
          <KpiTile icon={Octagon} tone="danger" label="Fault" loading={loading} value={count("fault")} context={pct(count("fault"))} />
          <KpiTile
            icon={PowerOff}
            label="Unavailable"
            loading={loading}
            value={count("offline") + count("maintenance")}
            context={`Offline or in maintenance, ${pct(count("offline") + count("maintenance")) ?? "0% of total"}`}
          />
        </div>

        <Card>
          <div className="flex flex-wrap gap-3 p-4 border-b border-line">
            <SearchInput
              label="Search assets"
              placeholder="Search asset name, ID, or location…"
              value={values.q}
              onChange={(q) => set({ q })}
              className="flex-[2_1_240px]"
            />
            <SelectFilter
              label="Status"
              allLabel="All statuses"
              value={values.status}
              onChange={(status) => set({ status })}
              options={Object.entries(ASSET_STATUS).map(([value, m]) => ({ value, label: m.label }))}
              className="flex-[1_1_150px]"
            />
            <SelectFilter
              label="Location"
              allLabel="All locations"
              value={values.location}
              onChange={(location) => set({ location })}
              options={locations.map((l) => ({ value: l, label: l }))}
              className="flex-[1_1_160px]"
            />
            <SelectFilter
              label="Asset type"
              allLabel="All asset types"
              value={values.type}
              onChange={(type) => set({ type })}
              options={types.map((t) => ({ value: t, label: t }))}
              className="flex-[1_1_170px]"
            />
            <ResetButton onClick={reset} disabled={!filtering && !values.sort} />
          </div>
          <AssetTable
            rows={equipment.data ? rows : undefined}
            isLoading={loading}
            error={equipment.error}
            onRetry={() => void equipment.refetch()}
            sort={{ key: sortField, order }}
            onSortChange={(s) => set({ sort: s.key, order: s.order })}
            onAsk={(q) => {
              if (collapsed) toggleCollapsed();
              void chat.send(q);
            }}
            empty={
              <EmptyState
                icon={SearchX}
                title={filtering ? "No assets match these filters" : "No assets registered"}
                message={filtering ? "Clear a filter or search for a different name, ID, or location." : "Assets appear here once they are added to the plant register."}
                action={filtering ? <ResetButton onClick={reset} label="Clear filters" /> : undefined}
              />
            }
          />
          {filtered.length > 0 && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={(p) => set({ page: p })} noun="assets" />
          )}
        </Card>
        {values.status && <p className="sr-only">Filtered to {assetStatus(values.status).label} assets.</p>}
      </div>

      <CopilotPanel
        prompts={prompts}
        knownAssets={knownAssets}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        className={collapsed ? "" : "h-[640px] wide:h-[calc(100dvh-64px-48px)] wide:sticky wide:top-[88px]"}
      />
    </div>
  );
}
