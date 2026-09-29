import { FileText, MessageSquare } from "lucide-react";
import type { Sop } from "../../api/models";
import { formatDate, humanize } from "../../lib/format";
import { SOP_STATUS } from "../../lib/status";
import { DataTable, type Column } from "../ui/DataTable";
import { Menu } from "../ui/Menu";
import { EmptyState } from "../ui/States";
import { StatusLabel } from "../ui/StatusLabel";

interface SopTableProps {
  rows: Sop[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onOpen: (sop: Sop) => void;
  onAsk: (sop: Sop) => void;
  empty?: React.ReactNode;
}

/** SOP catalogue rows: title is primary, ID in mono, View is the primary row action. */
export function SopTable({ rows, isLoading, error, onRetry, onOpen, onAsk, empty }: SopTableProps) {
  const columns: Column<Sop>[] = [
    {
      key: "id",
      header: "ID",
      cell: (s) => (
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
          <FileText className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
          <span className="font-data text-body">{s.id}</span>
        </span>
      )
    },
    { key: "title", header: "Title", cell: (s) => <span className="block min-w-[180px] text-small font-medium text-ink">{s.title}</span> },
    { key: "category", header: "Category", cell: (s) => <span className="text-body">{humanize(s.category)}</span> },
    {
      key: "asset",
      header: "Asset",
      cell: (s) => <span className="block max-w-[170px] truncate" title={s.assets.join(", ")}>{s.assets.length ? s.assets.join(", ") : "All"}</span>
    },
    { key: "updated", header: "Last updated", cell: (s) => <span className="font-data whitespace-nowrap">{formatDate(s.updated)}</span> },
    { key: "status", header: "Status", cell: (s) => <StatusLabel meta={SOP_STATUS[s.status]} /> },
    {
      key: "actions",
      header: "Actions",
      cell: (s) => (
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(s);
            }}
            className="inline-flex items-center h-9 px-3 rounded-[var(--radius-control)] text-meta font-semibold text-accent bg-accent-bg hover:bg-accent-line/50 transition-colors cursor-pointer"
          >
            View<span className="sr-only"> {s.title}</span>
          </button>
          <Menu label={`More actions for ${s.title}`} actions={[{ label: "Ask the copilot about it", icon: MessageSquare, onSelect: () => onAsk(s) }]} />
        </span>
      )
    }
  ];

  return (
    <DataTable
      caption="Standard operating procedures"
      columns={columns}
      rows={rows}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onRowClick={onOpen}
      skeletonRows={6}
      empty={empty ?? <EmptyState icon={FileText} title="No SOPs" message="Procedures linked to this asset appear here." />}
    />
  );
}
