import { useEffect, useState } from "react";
import { X, Info, Zap, Shield, TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { type Security, generateCandles } from "@/lib/mock-data";
import { toast } from "sonner";

export function SecurityDrawer({
  security,
  onClose,
}: {
  security: Security | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (security) {
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [security, onClose]);

  if (!security) return null;

  const positive = security.changePct >= 0;
  const candles = generateCandles(security.price, 30);
  const chartData = candles.map((c, i) => ({
    i,
    open: c.o,
    close: c.c,
    high: c.h,
    low: c.l,
    body: [Math.min(c.o, c.c), Math.max(c.o, c.c)] as [number, number],
    wick: [c.l, c.h] as [number, number],
    up: c.c >= c.o,
  }));

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[rgba(15,23,42,0.3)] animate-slide-in-up"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[20px] font-bold text-foreground tracking-tight">
                  {security.name}
                </h2>
                <span className="text-[11px] font-bold text-white bg-[#0D2F55] px-1.5 py-0.5 rounded-md">
                  {security.symbol}
                </span>
              </div>
              <div className="text-[13px] text-muted-foreground mt-0.5">{security.sector}</div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors -mr-2 -mt-1"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-[32px] font-bold text-foreground tabular leading-none">
              {security.price.toLocaleString()}
            </span>
            <span
              className={`text-[15px] font-bold tabular ${
                positive ? "text-[#16A34A]" : "text-[#DC2626]"
              }`}
            >
              {positive ? "▲" : "▼"} {Math.abs(security.changePct).toFixed(2)}%
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Updated 23s ago</div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex bg-[#F1F5F9] rounded-full p-0.5">
                {(["1D", "1W", "1M"] as const).map((t, idx) => (
                  <button
                    key={t}
                    className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                      idx === 1
                        ? "bg-[#0D2F55] text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 48, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  {/* Wicks */}
                  <Bar dataKey="wick" barSize={1.5} isAnimationActive={false}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.up ? "#16A34A" : "#DC2626"} />
                    ))}
                  </Bar>
                  {/* Bodies */}
                  <Bar dataKey="body" barSize={7} isAnimationActive={false} radius={1}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.up ? "#16A34A" : "#DC2626"} />
                    ))}
                  </Bar>
                  {security.support && (
                    <ReferenceLine
                      y={security.support}
                      stroke="#16A34A"
                      strokeDasharray="4 4"
                      label={{
                        value: `S ${security.support}`,
                        position: "right",
                        fill: "#16A34A",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  {security.resistance && (
                    <ReferenceLine
                      y={security.resistance}
                      stroke="#DC2626"
                      strokeDasharray="4 4"
                      label={{
                        value: `R ${security.resistance}`,
                        position: "right",
                        fill: "#DC2626",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  {security.breakout && (
                    <ReferenceLine
                      y={security.breakout}
                      stroke="#D97706"
                      strokeDasharray="4 4"
                      label={{
                        value: `B ${security.breakout}`,
                        position: "right",
                        fill: "#D97706",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alert config */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-[15px] font-semibold text-foreground">Alert Levels</h3>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <LevelRow
                icon={<Shield className="w-4 h-4" />}
                label="Support Level"
                color="#16A34A"
                bg="#F0FDF4"
                value={security.support}
                last={security.triggeredToday?.includes("S") ? "Triggered today" : "Last triggered: 2 days ago"}
              />
              <LevelRow
                icon={<TrendingUp className="w-4 h-4" />}
                label="Resistance Level"
                color="#DC2626"
                bg="#FEF2F2"
                value={security.resistance}
                last={security.triggeredToday?.includes("R") ? "Triggered today" : "Never triggered"}
              />
              <LevelRow
                icon={<Zap className="w-4 h-4" />}
                label="Breakout Level"
                color="#D97706"
                bg="#FFFBEB"
                value={security.breakout}
                last={security.triggeredToday?.includes("B") ? "Triggered today" : "Never triggered"}
              />
            </div>
          </div>

          {/* Buffer + cooldown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3 bg-[#F8F9FB] rounded-lg border border-border">
              <div>
                <div className="text-[13px] font-semibold text-foreground">Notification Buffer</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Alert fires within ±0.5% of target
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white border border-border rounded-md px-2 py-1">
                <button className="text-muted-foreground hover:text-foreground w-5">−</button>
                <span className="text-[13px] font-semibold tabular w-10 text-center">0.5%</span>
                <button className="text-muted-foreground hover:text-foreground w-5">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-[#F8F9FB] rounded-lg border border-border">
              <div>
                <div className="text-[13px] font-semibold text-foreground">Cooldown Period</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Between repeat alerts</div>
              </div>
              <div className="flex items-center gap-1 bg-white border border-border rounded-md px-2 py-1">
                <button className="text-muted-foreground hover:text-foreground w-5">−</button>
                <span className="text-[13px] font-semibold tabular w-10 text-center">4h</span>
                <button className="text-muted-foreground hover:text-foreground w-5">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 bg-white">
          <button
            onClick={() => toast.success(`✓ Alert saved for ${security.symbol}`)}
            className="w-full h-11 bg-[#0D2F55] hover:bg-[#1A4A7A] text-white text-[14px] font-semibold rounded-lg transition-colors"
          >
            Save Alert
          </button>
          <button
            onClick={() => toast(`Test notification sent for ${security.symbol}`)}
            className="w-full mt-2 text-[13px] text-[#2563EB] font-medium hover:underline"
          >
            Test notification
          </button>
        </div>
      </aside>
    </div>
  );
}

function LevelRow({
  icon,
  label,
  color,
  bg,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  value?: number;
  last: string;
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-white">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{last}</div>
        </div>
        <input
          type="text"
          defaultValue={value != null ? value.toString() : ""}
          placeholder="e.g. 188.00"
          className="w-[100px] h-9 px-2.5 bg-white border border-border rounded-md text-[13px] font-semibold tabular text-right focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
        />
        <Toggle defaultOn={value != null} color={color} />
      </div>
    </div>
  );
}

function Toggle({ defaultOn }: { defaultOn: boolean; color: string }) {
  const [on, set] = useState(defaultOn);
  return (
    <button
      onClick={() => set(!on)}
      className="relative w-10 h-6 rounded-full transition-colors"
      style={{ background: on ? "#0D2F55" : "#CBD5E1" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

