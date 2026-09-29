import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { ErrorState } from "./States";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Set to make the header a sort control. */
  sortKey?: string;
  align?: "left" | "right";
  className?: string;
  /** Hidden in the phone card layout. */
  hideOnMobile?: boolean;
}

export interface SortState {
  key: string;
  order: "asc" | "desc";
}

interface DataTableProps<T> {
  /** Names the table for screen readers. */
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  /** Shown when the query returned no rows. */
  empty: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** Mouse shortcut for the row; a link inside the row must offer the same for keyboard users. */
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  skeletonRows?: number;
  /** Row density: "normal" (48px standard list) or "spacious" (56px asset list). */
  density?: "normal" | "spacious";
}

/** Data table with a sticky header, 48px/56px rows, sortable headers, and loading/empty/error states. Cards on phones. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  onRetry,
  empty,
  sort,
  onSortChange,
  onRowClick,
  rowClassName,
  skeletonRows = 8,
  density = "normal"
}: DataTableProps<T>) {
  if (error && !rows) return <ErrorState title={`${caption} didn't load`} message={error.message} onRetry={onRetry} />;

  const toggleSort = (key: string) =>
    onSortChange?.({ key, order: sort?.key === key && sort.order === "desc" ? "asc" : "desc" });

  const loading = isLoading && !rows;
  const body = loading ? null : rows && rows.length === 0 ? empty : null;

  return (
    <div className="relative">
      {/* Tablet and up: table. Horizontal scroll only when columns cannot fit. */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-[var(--z-sticky)] bg-sunken">
            <tr>
              {columns.map((col) => {
                const active = !!col.sortKey && sort?.key === col.sortKey;
                const SortIcon = !active ? ArrowUpDown : sort!.order === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortKey ? (active ? (sort!.order === "asc" ? "ascending" : "descending") : "none") : undefined}
                    className={cn(
                      "h-11 px-3 first:pl-4 last:pr-4 border-b border-line text-label font-semibold text-body whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.className
                    )}
                  >
                    {col.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.sortKey!)}
                        className="inline-flex items-center gap-1 -mx-1 px-1 h-8 rounded hover:text-ink cursor-pointer"
                      >
                        {col.header}
                        <SortIcon className={cn("w-3.5 h-3.5", active ? "text-ink" : "text-faint")} aria-hidden="true" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i} aria-hidden="true">
                    {columns.map((col) => (
                      <td key={col.key} className={cn(density === "spacious" ? "h-14" : "h-12", "px-4 border-b border-line")}>
                        <div className="skeleton h-3.5 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "hover:bg-sunken transition-colors duration-100",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row)
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          density === "spacious" ? "h-14" : "h-12",
                          "px-3 first:pl-4 last:pr-4 py-2 border-b border-line text-meta text-ink align-middle",
                          col.align === "right" && "text-right",
                          col.className
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per row, label beside each value. */}
      <ul className="md:hidden divide-y divide-line" aria-label={caption}>
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="p-4 space-y-2" aria-hidden="true">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
              </li>
            ))
          : rows?.map((row) => (
              <li key={rowKey(row)} className={cn("p-4", rowClassName?.(row))}>
                <dl className="grid grid-cols-[minmax(88px,auto)_1fr] gap-x-3 gap-y-1.5 text-meta">
                  {columns
                    .filter((col) => !col.hideOnMobile && col.header)
                    .map((col) => (
                      <div key={col.key} className="contents">
                        <dt className="text-muted">{col.header}</dt>
                        <dd className="min-w-0 text-ink">{col.cell(row)}</dd>
                      </div>
                    ))}
                </dl>
              </li>
            ))}
      </ul>

      {loading && <span className="sr-only" role="status">Loading {caption.toLowerCase()}…</span>}
      {body}
    </div>
  );
}
