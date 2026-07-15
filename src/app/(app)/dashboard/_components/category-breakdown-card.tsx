"use client";

import { useRouter } from "next/navigation";
import { formatARS } from "@/lib/utils";
import { categoryExpensesHref } from "@/lib/utils/categories";
import type { CategoryGroup } from "@/lib/utils/categories";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CategoryBarShapeProps {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly color?: string;
  readonly categoryId?: string | null;
  readonly name?: string;
  readonly onSelect?: (categoryId: string) => void;
}

// Commit 7 — category navigation: the bar itself is clickable when it has a
// real categoryId; "Sin categoría" (categoryId null) MUST NOT navigate, so it
// stays a plain non-interactive rect (no cursor, no role, no handler).
function CategoryBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  color = "var(--fg-3)",
  categoryId = null,
  name,
  onSelect,
}: CategoryBarShapeProps) {
  const clickable = !!categoryId && !!onSelect;
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(0, width)}
      height={height}
      fill={color}
      rx={4}
      onClick={clickable ? () => onSelect!(categoryId!) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Ver gastos de ${name}` : undefined}
      style={{ cursor: clickable ? "pointer" : "default" }}
    />
  );
}

interface CategoryYAxisTickProps {
  readonly x?: number;
  readonly y?: number;
  readonly payload?: { value: string };
  readonly index?: number;
  readonly rows: ReadonlyArray<{ name: string; categoryId: string | null }>;
  readonly onSelect: (categoryId: string) => void;
}

// Commit 7 — the axis label is the second (larger) tap target for the same
// navigation. Real categories get a trailing chevron (arrow affordance);
// "Sin categoría" renders as plain text, no chevron, not interactive.
function CategoryYAxisTick({
  x = 0,
  y = 0,
  payload,
  index = 0,
  rows,
  onSelect,
}: CategoryYAxisTickProps) {
  const row = rows[index];
  const clickable = !!row?.categoryId;
  const label = payload?.value ?? row?.name ?? "";

  function activate() {
    if (row?.categoryId) onSelect(row.categoryId);
  }

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={clickable ? activate : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activate();
              }
            }
          : undefined
      }
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? `Ver gastos de ${label}` : undefined}
      style={{ cursor: clickable ? "pointer" : "default", outline: "none" }}
    >
      <text
        x={clickable ? -20 : -6}
        y={0}
        dy={4}
        textAnchor="end"
        fontSize={12}
        fontFamily="var(--font-sans)"
        fill="var(--fg-2)"
      >
        {label}
      </text>
      {clickable && (
        <path
          d="M -16 -4 L -10 0 L -16 4"
          stroke="var(--fg-3)"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

interface CategoryTooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{ value: number }>;
}

function CategoryTooltip({ active, payload }: CategoryTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        color: "var(--fg-1)",
      }}
    >
      {formatARS(payload[0].value)}
    </div>
  );
}

export function CategoryBreakdownCard({
  breakdown,
}: {
  readonly breakdown: CategoryGroup[];
}) {
  const router = useRouter();

  if (breakdown.length === 0) return null;

  const chartData = breakdown.map((g) => ({
    name: g.category ? g.category.name : "Sin categoría",
    total: g.total,
    color: g.category?.color ?? "var(--fg-3)",
    categoryId: g.category?.id ?? null,
  }));

  // Commit 7 — category navigation: real categories navigate to the
  // pre-filtered expenses list; "Sin categoría" (categoryId null) never
  // reaches here because both interactive targets below gate on it first.
  function handleSelect(categoryId: string) {
    const href = categoryExpensesHref(categoryId);
    if (href) router.push(href);
  }

  const rowHeight = 36;
  const chartHeight = breakdown.length * rowHeight + 16;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 16,
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: "var(--font-sans)",
          }}
        >
          Por categoría
        </div>
      </div>
      {/* role="group" (not "img"): several rows are now interactive buttons
          (Commit 7) — "img" would flatten them out of the a11y tree. */}
      <div
        role="group"
        aria-label="Distribución de gastos por categoría"
        style={{ padding: "12px 8px 12px 0" }}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
          >
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={
                <CategoryYAxisTick rows={chartData} onSelect={handleSelect} />
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--bg-sunken)", opacity: 0.5 }}
              content={<CategoryTooltip />}
            />
            <Bar
              dataKey="total"
              radius={[0, 6, 6, 0]}
              maxBarSize={20}
              shape={<CategoryBarShape onSelect={handleSelect} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
