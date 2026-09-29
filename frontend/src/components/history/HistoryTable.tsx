import { Link } from "react-router";
import { History as HistoryIcon } from "lucide-react";
import type { HistoryEvent } from "../../api/models";
import { formatDateTime } from "../../lib/format";
import { DataTable, type Column } from "../ui/DataTable";
import { EmptyState } from "../ui/States";
import { EVENT_META, eventLink } from "./eventMeta";

interface HistoryTableProps {
  events: HistoryEvent[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  empty?: React.ReactNode;
  showAsset?: boolean;
}

/** Auditable timeline rows: timestamp and asset ID in mono, one icon per event type, a View link. */
export function HistoryTable({ events, isLoading, error, onRetry, empty, showAsset = true }: HistoryTableProps) {
  const columns: Column<HistoryEvent>[] = [
    { key: "time", header: "Time", cell: (e) => <span className="font-data whitespace-nowrap">{formatDateTime(e.time)}</span> },
    {
      key: "type",
      header: "Type",
      cell: (e) => {
        const meta = EVENT_META[e.type];
        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <meta.icon className={`w-4 h-4 shrink-0 ${meta.iconClass}`} aria-hidden="true" />
            {meta.label}
          </span>
        );
      }
    },
    ...(showAsset
      ? [{ key: "asset", header: "Asset", cell: (e: HistoryEvent) => <span className="font-data">{e.machine_id ?? "Plant"}</span> }]
      : []),
    { key: "description", header: "Description", cell: (e) => <span className="block min-w-[240px] max-w-[60ch]">{e.description}</span> },
    { key: "user", header: "User", cell: (e) => <span className="whitespace-nowrap">{e.user ?? "System"}</span> },
    {
      key: "action",
      header: "Action",
      cell: (e) => {
        const to = eventLink(e);
        return to ? (
          <Link to={to} className="inline-flex items-center h-9 px-3 rounded-[var(--radius-control)] text-meta font-semibold text-accent bg-accent-bg hover:bg-accent-line/50 transition-colors">
            View<span className="sr-only"> {EVENT_META[e.type].label.toLowerCase()} {e.ref ?? ""}</span>
          </Link>
        ) : (
          <span className="text-body">—</span>
        );
      }
    }
  ];

  return (
    <DataTable
      caption="History"
      columns={columns}
      rows={events}
      rowKey={(e) => `${e.time}-${e.type}-${e.ref}-${e.description}`}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      empty={empty ?? <EmptyState icon={HistoryIcon} title="No events" message="Alarms, work orders, and maintenance appear here as they happen." />}
    />
  );
}
