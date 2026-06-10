import React from 'react';
import { 
  ComposedChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell 
} from 'recharts';
import { useDrawer } from '../../hooks/useDrawer';
import { useCandlestickQuery } from '../../hooks/queries/useCandlestickQuery';

const CandlestickBar = (props) => {
  const { x, y, width, height, payload, yAxis } = props;
  const { open, close, high, low } = payload;
  
  if (!yAxis) return null; // Wait for yAxis scale
  const scaleY = yAxis.scale;

  const isUp = close >= open;
  const color = isUp ? '#16A34A' : '#DC2626';
  
  // Calculate pixel positions using the chart's yAxis scale
  const topY = scaleY(Math.max(open, close));
  const bottomY = scaleY(Math.min(open, close));
  const highY = scaleY(high);
  const lowY = scaleY(low);
  
  const bodyHeight = Math.max(Math.abs(bottomY - topY), 1);
  const center = x + width / 2;
  
  return (
    <g>
      {/* Wick - top */}
      <line x1={center} y1={highY} x2={center} y2={topY} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect 
        x={x} 
        y={topY} 
        width={width} 
        height={bodyHeight}
        fill={isUp ? '#F0FDF4' : '#FEF2F2'} 
        stroke={color} 
        strokeWidth={1} 
      />
      {/* Wick - bottom */}
      <line x1={center} y1={bottomY} x2={center} y2={lowY} stroke={color} strokeWidth={1} />
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

  const hasLevels = security?.support?.enabled || security?.resistance?.enabled || security?.breakout?.enabled;

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
          
          <Bar dataKey="close" shape={<CandlestickBar />} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} />
            ))}
          </Bar>

          {security?.support?.enabled && security?.support?.level && (
            <ReferenceLine
              y={parseFloat(security.support.level)}
              stroke="#16A34A"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<ChartLevelLabel type="support" value={parseFloat(security.support.level)} />}
            />
          )}
          {security?.resistance?.enabled && security?.resistance?.level && (
            <ReferenceLine
              y={parseFloat(security.resistance.level)}
              stroke="#DC2626"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<ChartLevelLabel type="resistance" value={parseFloat(security.resistance.level)} />}
            />
          )}
          {security?.breakout?.enabled && security?.breakout?.level && (
            <ReferenceLine
              y={parseFloat(security.breakout.level)}
              stroke="#D97706"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={<ChartLevelLabel type="breakout" value={parseFloat(security.breakout.level)} />}
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
