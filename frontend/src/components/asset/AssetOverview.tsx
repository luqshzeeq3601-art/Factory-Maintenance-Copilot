import type { Alarm, Equipment } from "../../api/models";
import { useHistory, useSamples } from "../../api/queries";
import { formatDate, formatHours, humanize } from "../../lib/format";
import { assetStatus } from "../../lib/status";
import { RecentActivityCard } from "../dashboard/RecentActivityCard";
import { MetricTiles } from "../telemetry/MetricTiles";
import { windowStart } from "../telemetry/metrics";
import { Card, CardHeader } from "../ui/Card";
import { StatusLabel } from "../ui/StatusLabel";

function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,40%)_1fr] gap-x-4 gap-y-2.5 px-5 pb-5 text-meta">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-body">{label}</dt>
          <dd className="text-ink min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Overview tab: sensor summary and recent activity on the left, identity and current status on the right. */
export function AssetOverview({ asset, activeAlarms }: { asset: Equipment; activeAlarms: Alarm[] }) {
  const since = windowStart(24);
  const samples = useSamples(asset.machine_id, since);
  const activity = useHistory({ machine_id: asset.machine_id, page_size: 5 });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,63%)_minmax(0,37%)]">
      <div className="space-y-4 min-w-0">
        <Card aria-labelledby="key-metrics-heading">
          <CardHeader id="key-metrics-heading" title="Key metrics" subtitle="Last 24 hours" />
          <div className="px-5 pb-5">
            <MetricTiles
              samples={samples.data?.samples}
              isLoading={samples.isLoading}
              error={samples.error}
              onRetry={() => void samples.refetch()}
              windowLabel="Last 24 hours"
            />
          </div>
        </Card>
        <RecentActivityCard
          data={activity.data}
          isLoading={activity.isLoading}
          error={activity.error}
          onRetry={() => void activity.refetch()}
          viewAllHref={`/history?machine_id=${asset.machine_id}`}
        />
      </div>
      <div className="space-y-4">
        <Card aria-labelledby="asset-info-heading">
          <CardHeader id="asset-info-heading" title="Asset information" />
          <Facts
            rows={[
              ["Asset name", asset.name],
              ["Asset ID", <span key="id" className="font-data">{asset.machine_id}</span>],
              ["Location", asset.location],
              ["Asset type", asset.type],
              ["Criticality", humanize(asset.criticality ?? "—")],
              ["Installed", <span key="installed" className="font-data">{formatDate(asset.install_date)}</span>]
            ]}
          />
        </Card>
        <Card aria-labelledby="asset-status-heading">
          <CardHeader id="asset-status-heading" title="Current status" />
          <Facts
            rows={[
              ["Operational status", <StatusLabel key="status" meta={assetStatus(asset.status)} tinted={false} />],
              ["Active alarms", <span key="alarms" className="font-data">{activeAlarms.length}</span>],
              ["Last service", <span key="service" className="font-data">{formatDate(asset.last_service)}</span>],
              ["Operating hours", <span key="hours" className="font-data">{formatHours(asset.operating_hours)}</span>]
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
