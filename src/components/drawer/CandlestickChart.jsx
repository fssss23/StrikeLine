import React from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Customized
} from 'recharts';
import { useDrawer } from '../../hooks/useDrawer';
import { useCandlestickQuery } from '../../hooks/queries/useCandlestickQuery';

// Candlestick layer rendered via <Customized>, which receives the chart's
// internal state (xAxisMap / yAxisMap) — the real axis scales. The previous
// approach relied on `props.yAxis` inside a custom <Bar> shape, but Recharts
// strips non-SVG props before cloning the shape, so the scale was always
// undefined and NO candles ever rendered. Reading the scales here is reliable.
const CandlesticksLayer = ({ xAxisMap, yAxisMap, bars }) => {
  if (!xAxisMap || !yAxisMap || !bars || bars.length === 0) return null;

  const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
  const xScale = xAxis?.scale;
  const yScale = yAxis?.scale;
  if (!xScale || !yScale) return null;

  // A band scale exists because a (transparent) <Bar> is present.
  const band = xScale.bandwidth ? xScale.bandwidth() : 8;
  const bodyW = Math.max(Math.min(band * 0.6, 16), 2);

  return (
    <g>
      {bars.map((d, i) => {
        const xLeft = xScale(d.time);
        if (xLeft == null) return null;
        const center = xLeft + band / 2;

        const isUp = d.close >= d.open;
        const color = isUp ? '#16A34A' : '#DC2626';
        const fill = isUp ? '#F0FDF4' : '#FEF2F2';

        const topY = yScale(Math.max(d.open, d.close));
        const bottomY = yScale(Math.min(d.open, d.close));
        const highY = yScale(d.high);
        const lowY = yScale(d.low);
        const bodyHeight = Math.max(Math.abs(bottomY - topY), 1);

        return (
          <g key={`candle-${i}`}>
            {/* Upper wick */}
            <line x1={center} y1={highY} x2={center} y2={topY} stroke={color} strokeWidth={1} />
            {/* Body */}
            <rect
              x={center - bodyW / 2}
              y={topY}
              width={bodyW}
              height={bodyHeight}
              fill={fill}
              stroke={color}
              strokeWidth={1}
            />
            {/* Lower wick */}
            <line x1={center} y1={bottomY} x2={center} y2={lowY} stroke={color} strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
};

const ChartLevelLabel = ({ viewBox, type, value }) => {
  const colors = {
    support: { bg: '#F0FDF4', text: '#16A34A', prefix: 'S' },
    resistance: { bg: '#FEF2F2', text: '#DC2626', prefix: 'R' },
    breakout: { bg: '#FFFBEB', text: '#D97706', prefix: 'B' },
  };
  const c = colors[type];
  if (!viewBox) return null;
  return (
    <g>
      <rect x={viewBox.x + viewBox.width - 56} y={viewBox.y - 10}
            width={54} height={20} rx={4} fill={c.bg} />
      <text x={viewBox.x + viewBox.width - 29} y={viewBox.y + 4}
            textAnchor="middle" fill={c.text} fontSize={10} fontWeight={600}>
        {c.prefix} {value.toFixed(2)}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isUp = data.close >= data.open;
    const change = data.close - data.open;
    const changePct = (change / data.open) * 100;
    const changeColor = isUp ? 'text-signal-green' : 'text-signal-red';

    return (
      <div className="bg-white shadow-card rounded-[12px] p-3 border border-surface-border min-w-[160px]">
        <div className="text-[12px] text-text-secondary mb-1">Time: {data.time}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] tabular-nums">
          <div><span className="text-text-secondary">O:</span> <span className="font-medium text-text-primary">{data.open.toFixed(2)}</span></div>
          <div><span className="text-text-secondary">H:</span> <span className="font-medium text-text-primary">{data.high.toFixed(2)}</span></div>
          <div><span className="text-text-secondary">L:</span> <span className="font-medium text-text-primary">{data.low.toFixed(2)}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">C:</span> 
            <span className={`font-medium ${changeColor}`}>
              {data.close.toFixed(2)} {isUp ? '▲' : '▼'}{Math.abs(changePct).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-[12px] text-text-secondary mt-1">
          Vol: {(data.volume / 1000).toFixed(1)}K
        </div>
      </div>
    );
  }
  return null;
};

export function CandlestickChart({ activeTimeframe }) {
  const { security } = useDrawer();
  const { data = [], isLoading } = useCandlestickQuery(security?.symbol, activeTimeframe);

  const rule = security?.alert_rule;
  const supportLevel = rule?.support_enabled && rule?.support_level ? Number(rule.support_level) : null;
  const resistanceLevel = rule?.resistance_enabled && rule?.resistance_level ? Number(rule.resistance_level) : null;
  const breakoutLevel = rule?.breakout_enabled && rule?.breakout_level ? Number(rule.breakout_level) : null;
  const hasLevels = supportLevel != null || resistanceLevel != null || breakoutLevel != null;

  if (isLoading) {
    return (
      <div className="w-full h-[220px] flex flex-col items-center justify-center bg-surface-card rounded-[12px] border border-surface-border">
        <div className="w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-xs font-medium text-text-secondary">Loading market data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[220px] flex items-center justify-center bg-surface-card rounded-[12px] border border-surface-border">
        <div className="text-sm text-text-secondary">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[220px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 60, bottom: 0, left: -20 }}
        >
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#94A3B8', tabularNums: true }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.toFixed(1)}
            orientation="right"
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#E2E8F0', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          
          {/* Transparent bars establish the category band scale + drive the
              tooltip; the visible candles are drawn by the Customized layer. */}
          <Bar dataKey="close" fill="transparent" isAnimationActive={false} />
          <Customized component={(props) => <CandlesticksLayer {...props} bars={data} />} />


          {supportLevel != null && (
            <ReferenceLine
              y={supportLevel}
              stroke="#16A34A"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<ChartLevelLabel type="support" value={supportLevel} />}
            />
          )}
          {resistanceLevel != null && (
            <ReferenceLine
              y={resistanceLevel}
              stroke="#DC2626"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<ChartLevelLabel type="resistance" value={resistanceLevel} />}
            />
          )}
          {breakoutLevel != null && (
            <ReferenceLine
              y={breakoutLevel}
              stroke="#D97706"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<ChartLevelLabel type="breakout" value={breakoutLevel} />}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {!hasLevels && (
        <div className="absolute -bottom-6 left-0 right-0 border-t border-dashed border-surface-border pt-2 text-center">
          <span className="text-[12px] text-text-secondary">
            Configure alert levels below to see them on this chart
          </span>
        </div>
      )}
    </div>
  );
}
