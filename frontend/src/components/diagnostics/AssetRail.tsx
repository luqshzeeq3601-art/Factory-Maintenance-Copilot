import { useMemo, useState } from "react";
import { NavLink } from "react-router";
import { ChevronRight } from "lucide-react";
import type { Equipment } from "../../api/models";
import { cn } from "../../lib/cn";
import { assetStatus, attentionRank } from "../../lib/status";
import { Card } from "../ui/Card";
import { SearchInput } from "../ui/Filters";
import { ErrorState } from "../ui/States";
import { StatusLabel } from "../ui/StatusLabel";
import { EquipmentThumbnail } from "../workspace/EquipmentThumbnail";

interface AssetRailProps {
  equipment: Equipment[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Diagnostics tab to keep when switching asset. */
  tab: string;
}

/** Asset picker for Diagnostics, most-urgent first. Each entry is a link, so the choice is in the URL. */
export function AssetRail({ equipment, isLoading, error, onRetry, tab }: AssetRailProps) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...(equipment ?? [])]
      .filter((e) => !needle || [e.name, e.machine_id, e.location].some((f) => f.toLowerCase().includes(needle)))
      .sort((a, b) => attentionRank(a) - attentionRank(b));
  }, [equipment, q]);

  return (
    <Card aria-labelledby="rail-heading" className="flex flex-col min-h-0 lg:max-h-[calc(100dvh-64px-48px-60px)] lg:sticky lg:top-[88px]">
      <div className="p-4 space-y-3 border-b border-line">
        <h2 id="rail-heading" className="text-section font-semibold">
          Select asset
        </h2>
        <SearchInput label="Search assets" placeholder="Search assets…" value={q} onChange={setQ} debounceMs={0} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
        {error && !equipment ? (
          <ErrorState compact title="Assets didn't load" message={error.message} onRetry={onRetry} />
        ) : isLoading ? (
          <div className="space-y-2 p-2" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="skeleton h-[76px]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p role="status" className="p-4 text-meta text-body">
            No assets match “{q}”.
          </p>
        ) : (
          <ul className="space-y-1">
            {list.map((a) => (
              <li key={a.machine_id}>
                <NavLink
                  to={`/diagnostics/${a.machine_id}${tab === "live" ? "" : `/${tab}`}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 p-2.5 rounded-[var(--radius-control)] border transition-colors",
                      isActive ? "border-accent-line bg-accent-bg" : "border-transparent hover:bg-sunken"
                    )
                  }
                >
                  <EquipmentThumbnail machineId={a.machine_id} name={a.name} type={a.type} size="sm" className="bg-panel" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-small font-semibold text-ink truncate">{a.name}</span>
                    <span className="block font-data text-label text-body">{a.machine_id}</span>
                    <span className="block mt-1">
                      <StatusLabel meta={assetStatus(a.status)} tinted={false} className="text-label" />
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-subtle shrink-0" aria-hidden="true" />
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
