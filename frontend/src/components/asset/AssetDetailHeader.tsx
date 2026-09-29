import { useNavigate } from "react-router";
import { ClipboardPlus, FileText, History, MessageSquare, Stethoscope } from "lucide-react";
import type { Equipment } from "../../api/models";
import { humanize } from "../../lib/format";
import { assetStatus } from "../../lib/status";
import { AndonLight } from "../ui/AndonLight";
import { Button, ButtonLink } from "../ui/Button";
import { Menu } from "../ui/Menu";
import { StatusLabel } from "../ui/StatusLabel";
import { EquipmentThumbnail } from "../workspace/EquipmentThumbnail";

interface AssetDetailHeaderProps {
  asset: Equipment;
  /** Opens the first SOP linked to this asset, when one exists. */
  onOpenSop?: () => void;
  onAsk: (question: string) => void;
}

export function AssetDetailHeader({ asset, onOpenSop, onAsk }: AssetDetailHeaderProps) {
  const navigate = useNavigate();
  const status = assetStatus(asset.status);
  return (
    <div className="flex flex-wrap items-start gap-6">
      <EquipmentThumbnail machineId={asset.machine_id} name={asset.name} type={asset.type} size="xl" className="bg-panel shadow-2xs" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-heading font-bold tracking-[-0.02em] text-ink">{asset.name}</h1>
          <span className="inline-flex items-center gap-2">
            <AndonLight status={asset.status} size="lg" />
            <StatusLabel meta={status} tinted />
          </span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-copy text-body">
          <span className="font-data font-medium text-ink">{asset.machine_id}</span>
          <span aria-hidden="true">·</span>
          <span>{asset.location}</span>
          <span aria-hidden="true">·</span>
          <span>{asset.type}</span>
        </p>
        {asset.criticality && (
          <p className="mt-2 text-meta text-body">
            Criticality: <span className="font-semibold text-ink">{humanize(asset.criticality)}</span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink to={`/work-orders?new=${asset.machine_id}`} icon={ClipboardPlus}>
          Create work order
        </ButtonLink>
        {onOpenSop && (
          <Button variant="primary" icon={FileText} onClick={onOpenSop}>
            Open SOP
          </Button>
        )}
        <Menu
          label={`More actions for ${asset.name}`}
          actions={[
            { label: "Open diagnostics", icon: Stethoscope, onSelect: () => navigate(`/diagnostics/${asset.machine_id}`) },
            { label: "Ask the copilot", icon: MessageSquare, onSelect: () => onAsk(`What is the current condition of ${asset.name} (${asset.machine_id}) and what should I check first?`) },
            { label: "View full history", icon: History, onSelect: () => navigate(`/history?machine_id=${asset.machine_id}`) }
          ]}
        />
      </div>
    </div>
  );
}
