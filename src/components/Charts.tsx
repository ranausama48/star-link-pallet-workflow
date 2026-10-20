/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

// Monthly Inbound vs Outbound Bar Chart
export function MonthlyBarChart({
  data,
}: {
  data: Array<{ month: string; ib: number; ob: number }>;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-500">
        No monthly movement data available.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.ib, d.ob)), 100);
  const chartHeight = 220;
  const chartWidth = 580;
  const paddingX = 40;
  const paddingY = 30;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const barGroupWidth = usableWidth / data.length;
  const singleBarWidth = Math.min(24, (barGroupWidth - 14) / 2);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-64 select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - paddingY - ratio * usableHeight;
          const val = Math.round(ratio * maxVal);
          return (
            <g key={ratio}>
              <line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray={ratio === 0 ? undefined : '3 3'}
                strokeWidth={ratio === 0 ? 1.5 : 1}
              />
              <text
                x={paddingX - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-neutral-400 font-mono"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const groupCenterX = paddingX + i * barGroupWidth + barGroupWidth / 2;
          const ibHeight = (item.ib / maxVal) * usableHeight;
          const obHeight = (item.ob / maxVal) * usableHeight;
          const ibX = groupCenterX - singleBarWidth - 2;
          const obX = groupCenterX + 2;
          const ibY = chartHeight - paddingY - ibHeight;
          const obY = chartHeight - paddingY - obHeight;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={item.month}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer transition-opacity"
            >
              {/* Highlight background column */}
              {isHovered && (
                <rect
                  x={groupCenterX - barGroupWidth / 2}
                  y={paddingY}
                  width={barGroupWidth}
                  height={usableHeight}
                  fill="#F1F5F9"
                  opacity={0.6}
                  rx={4}
                />
              )}

              {/* Inbound Bar (Emerald Green) */}
              <rect
                x={ibX}
                y={ibY}
                width={singleBarWidth}
                height={Math.max(ibHeight, 2)}
                fill="#166534"
                rx={3}
                className="transition-all duration-200"
              />

              {/* Outbound Bar (Slate Gray) */}
              <rect
                x={obX}
                y={obY}
                width={singleBarWidth}
                height={Math.max(obHeight, 2)}
                fill="#94A3B8"
                rx={3}
                className="transition-all duration-200"
              />

              {/* Month Label */}
              <text
                x={groupCenterX}
                y={chartHeight - 8}
                textAnchor="middle"
                className="text-[11px] font-medium fill-neutral-600"
              >
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute top-2 right-4 bg-white/95 backdrop-blur-sm border border-neutral-200 shadow-md rounded-lg p-2.5 text-xs text-neutral-800 pointer-events-none z-10">
          <div className="font-semibold text-neutral-900 border-b border-neutral-100 pb-1 mb-1.5">
            {data[hoveredIdx].month}
          </div>
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-800 inline-block" />
              Inbound (IB):
            </span>
            <span className="font-mono tabular-nums font-semibold">{data[hoveredIdx].ib}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
              Outbound (OB):
            </span>
            <span className="font-mono tabular-nums font-semibold">{data[hoveredIdx].ob}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-neutral-100 text-neutral-500">
            <span>Net Growth:</span>
            <span
              className={`font-mono tabular-nums font-bold ${
                data[hoveredIdx].ib - data[hoveredIdx].ob >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {data[hoveredIdx].ib - data[hoveredIdx].ob > 0 ? '+' : ''}
              {data[hoveredIdx].ib - data[hoveredIdx].ob}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Facility Wise Comparison Bar Chart
export function FacilityComparisonChart({
  facilities,
}: {
  facilities: Array<{ code: string; name: string; ib: number; ob: number; soh: number }>;
}) {
  if (!facilities || facilities.length === 0) {
    return <div className="p-8 text-center text-sm text-neutral-400">No facility data available</div>;
  }

  const maxVal = Math.max(...facilities.map((f) => Math.max(f.ib, f.ob, f.soh)), 50);

  return (
    <div className="space-y-4">
      {facilities.map((fac) => {
        const sohPct = Math.min(100, Math.max(0, (fac.soh / maxVal) * 100));
        const ibPct = Math.min(100, Math.max(0, (fac.ib / maxVal) * 100));
        const obPct = Math.min(100, Math.max(0, (fac.ob / maxVal) * 100));

        return (
          <div key={fac.code} className="space-y-1.5 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50/70 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-900 truncate max-w-[200px]" title={fac.name}>
                {fac.code} <span className="font-normal text-neutral-500">· {fac.name}</span>
              </span>
              <div className="flex items-center gap-3 text-neutral-600 font-mono tabular-nums text-xs">
                <span>SOH: <strong className="text-emerald-800">{fac.soh}</strong></span>
                <span>IB: {fac.ib}</span>
                <span>OB: {fac.ob}</span>
              </div>
            </div>

            {/* Tri-color comparative progress bars */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-800 transition-all duration-500"
                  style={{ width: `${sohPct}%` }}
                  title={`Available SOH: ${fac.soh}`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Available Pallets: {fac.soh}</span>
                <span>Capacity Utilized: {Math.round(sohPct)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Donut / Distribution Breakdown
export function DistributionChart({
  items,
  title,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
  title: string;
}) {
  const total = items.reduce((acc, cur) => acc + cur.value, 0);

  const colors = [
    '#166534', // Forest green
    '#059669', // Emerald
    '#0284C7', // Sky
    '#D97706', // Amber
    '#64748B', // Slate
    '#4F46E5', // Indigo
  ];

  if (total === 0) {
    return <div className="p-8 text-center text-sm text-neutral-400">No {title.toLowerCase()} recorded yet</div>;
  }

  return (
    <div className="space-y-3">
      {/* Visual horizontal stacked bar */}
      <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex">
        {items.map((item, idx) => {
          if (item.value <= 0) return null;
          const pct = (item.value / total) * 100;
          const bg = item.color || colors[idx % colors.length];
          return (
            <div
              key={item.label}
              style={{ width: `${pct}%`, backgroundColor: bg }}
              className="h-full transition-all duration-500"
              title={`${item.label}: ${item.value} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {items.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const bg = item.color || colors[idx % colors.length];
          return (
            <div key={item.label} className="flex items-center justify-between p-2 rounded-md bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: bg }} />
                <span className="text-neutral-700 truncate" title={item.label}>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-2 font-mono tabular-nums">
                <span className="font-semibold text-neutral-900">{item.value}</span>
                <span className="text-neutral-400 text-[11px]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
