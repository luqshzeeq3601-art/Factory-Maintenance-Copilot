import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { Equipment } from "../../api/models";
import { cn } from "../../lib/cn";
import { formatHours } from "../../lib/format";
import { assetStatus, attentionRank } from "../../lib/status";
import { AndonLight } from "../ui/AndonLight";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState, ErrorState } from "../ui/States";
import { StatusLabel } from "../ui/StatusLabel";
import { EquipmentThumbnail } from "../workspace/EquipmentThumbnail";

const BOARD_SIZE = 5;

interface AndonBoardProps {
  equipment: Equipment[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

/** The assets that need attention first (fault, then maintenance, then criticality), as signal-tower cards. */
export function AndonBoard({ equipment, isLoading, error, onRetry }: AndonBoardProps) {
  const board = [...(equipment ?? [])].sort((a, b) => attentionRank(a) - attentionRank(b)).slice(0, BOARD_SIZE);

  return (
    <Card aria-labelledby="andon-heading">
      <CardHeader
        id="andon-heading"
        title="Andon board"
        subtitle="Assets needing attention first"
        action={
          <Link to="/assets" className="inline-flex items-center gap-1.5 h-10 px-2 text-small font-semibold text-accent hover:text-accent-hover">
            View all assets
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        }
      />
      <div className="px-5 pb-5">
        {error && !equipment ? (
          <ErrorState compact title="Assets didn't load" message={error.message} onRetry={onRetry} />
        ) : isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 wide:grid-cols-5" aria-hidden="true">
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
              <div key={i} className="skeleton h-[168px]" />
            ))}
          </div>
        ) : board.length === 0 ? (
          <EmptyState title="No assets registered" message="Assets appear here once they are added to the plant register." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 wide:grid-cols-5">
            {board.map((asset) => (
              <li key={asset.machine_id}>
                <AndonCard asset={asset} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function AndonCard({ asset }: { asset: Equipment }) {
  const meta = assetStatus(asset.status);
  const next = asset.next_service_in_hours;
  return (
    <Link
      to={`/assets/${asset.machine_id}`}
      className={cn(
        "group flex flex-col h-full rounded-[var(--radius-card)] border p-4 transition-colors duration-150",
        meta.tone === "danger" ? "bg-danger-bg/60 border-danger-line hover:border-danger" :
          meta.tone === "warn" ? "bg-warn-bg/70 border-warn-line hover:border-warn" : "bg-panel border-line hover:border-line-strong"
      )}
    >
      <div className="flex items-start gap-3">
        <EquipmentThumbnail machineId={asset.machine_id} name={asset.name} type={asset.type} size="md" className="bg-panel" />
        <div className="min-w-0 flex-1">
          <p className="text-title font-semibold text-ink truncate group-hover:underline underline-offset-2">{asset.name}</p>
          <p className="font-data text-label font-medium text-body">{asset.machine_id}</p>
          <p className="text-meta text-body truncate">{asset.location}</p>
        </div>
        <AndonLight status={asset.status} />
      </div>
      <div className="mt-3">
        <StatusLabel meta={meta} tinted={false} />
      </div>
      <dl className="mt-auto pt-3 grid grid-cols-2 gap-3 border-t border-line/80">
        <div>
          <dt className="text-label text-body">Operating hours</dt>
          <dd className="font-data text-small font-semibold text-ink">{formatHours(asset.operating_hours)}</dd>
        </div>
        <div>
          <dt className="text-label text-body">Next service</dt>
          <dd className={cn("font-data text-small font-semibold", next != null && next < 0 ? "text-danger" : "text-ink")}>
            {next == null ? "—" : next < 0 ? `${formatHours(-next)} over` : `in ${formatHours(next)}`}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
