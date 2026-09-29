import { Link, useNavigate } from "react-router";
import { ClipboardPlus, Eye, MessageSquare, Stethoscope } from "lucide-react";
import type { Equipment } from "../../api/models";
import { cn } from "../../lib/cn";
import { formatHours } from "../../lib/format";
import { assetStatus } from "../../lib/status";
import { DataTable, type Column, type SortState } from "../ui/DataTable";
import { Menu } from "../ui/Menu";
import { StatusLabel } from "../ui/StatusLabel";
import { EquipmentThumbnail } from "../workspace/EquipmentThumbnail";

interface AssetTableProps {
  rows: Equipment[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  empty: React.ReactNode;
  onAsk: (question: string) => void;
}

/** Next service as hours left of the interval; overdue reads in danger ink with "over". */
export function NextService({ asset }: { asset: Equipment }) {
  const left = asset.next_service_in_hours;
  if (left == null) return <span className="text-body">—</span>;
  return (
    <span className="leading-tight">
      <span className={cn("block whitespace-nowrap font-data font-semibold", left < 0 ? "text-danger" : "text-ink")}>
        {left < 0 ? `${formatHours(-left)} over` : formatHours(left)}
      </span>
      {asset.service_interval_hours != null && (
        <span className="block whitespace-nowrap text-label text-body">Every {formatHours(asset.service_interval_hours)}</span>
      )}
    </span>
  );
}

export function AssetTable({ rows, isLoading, error, onRetry, sort, onSortChange, empty, onAsk }: AssetTableProps) {
  const navigate = useNavigate();

  const columns: Column<Equipment>[] = [
    {
      key: "asset",
      header: "Asset",
      sortKey: "name",
      cell: (a) => (
        <span className="flex items-center gap-3 min-w-[160px] max-w-[196px]">
          <EquipmentThumbnail machineId={a.machine_id} name={a.name} type={a.type} size="sm" className="hidden min-[1600px]:flex" />
          <span className="min-w-0 leading-tight">
            <Link to={`/assets/${a.machine_id}`} onClick={(e) => e.stopPropagation()} className="block text-small font-semibold text-ink hover:underline underline-offset-2">
              {a.name}
            </Link>
            <span className="block text-label text-body truncate">{a.type}</span>
          </span>
        </span>
      )
    },
    { key: "id", header: "ID", sortKey: "machine_id", cell: (a) => <span className="font-data font-medium whitespace-nowrap">{a.machine_id}</span> },
    { key: "location", header: "Location", sortKey: "location", cell: (a) => <span className="text-ink">{a.location}</span> },
    {
      key: "hours",
      header: "Hours",
      sortKey: "operating_hours",
      align: "right",
      cell: (a) => <span className="font-data whitespace-nowrap">{formatHours(a.operating_hours)}</span>
    },
    { key: "status", header: "Status", sortKey: "status", cell: (a) => <StatusLabel meta={assetStatus(a.status)} /> },
    { key: "next", header: "Next service", sortKey: "next_service_in_hours", cell: (a) => <NextService asset={a} /> },
    {
      key: "actions",
      header: "Actions",
      hideOnMobile: true,
      className: "w-12",
      cell: (a) => (
        <Menu
          label={`Actions for ${a.name}`}
          actions={[
            { label: "View asset", icon: Eye, onSelect: () => navigate(`/assets/${a.machine_id}`) },
            { label: "Open diagnostics", icon: Stethoscope, onSelect: () => navigate(`/diagnostics/${a.machine_id}`) },
            { label: "Create work order", icon: ClipboardPlus, onSelect: () => navigate(`/work-orders?new=${a.machine_id}`) },
            { label: "Ask the copilot", icon: MessageSquare, onSelect: () => onAsk(`What is the current condition of ${a.name} (${a.machine_id})?`) }
          ]}
        />
      )
    }
  ];

  return (
    <DataTable
      caption="Assets"
      columns={columns}
      rows={rows}
      rowKey={(a) => a.machine_id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={(a) => navigate(`/assets/${a.machine_id}`)}
      empty={empty}
      skeletonRows={10}
      density="spacious"
    />
  );
}
