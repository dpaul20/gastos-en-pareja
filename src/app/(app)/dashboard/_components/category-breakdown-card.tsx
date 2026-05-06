import { formatARS } from "@/lib/utils";
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
}

function CategoryBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  color = "#B2BEC3",
}: CategoryBarShapeProps) {
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(0, width)}
      height={height}
      fill={color}
      rx={4}
    />
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
  if (breakdown.length === 0) return null;

  const chartData = breakdown.map((g) => ({
    name: g.category ? `${g.category.icon} ${g.category.name}` : "📦 Sin cat.",
    total: g.total,
    color: g.category?.color ?? "#B2BEC3",
  }));

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
      <div style={{ padding: "12px 8px 12px 0" }}>
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
              tick={{
                fontSize: 12,
                fill: "var(--fg-2)",
                fontFamily: "var(--font-sans)",
              }}
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
              shape={<CategoryBarShape />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
