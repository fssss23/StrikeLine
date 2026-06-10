import { useEffect, useState } from "react";
import { GripVertical, Zap } from "lucide-react";
import { type Security } from "@/lib/mock-data";

type LevelPillProps = {
  kind: "S" | "R" | "B";
  value?: number;
  triggered?: boolean;
};

function LevelPill({ kind, value, triggered }: LevelPillProps) {
  const config = {
    S: { label: "S", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", labelLong: "Set S" },
    R: { label: "R", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", labelLong: "Set R" },
    B: { label: "B", color: "#D97706", bg: "#FFFBEB", border: "#FED7AA", labelLong: "Set B" },
  }[kind];

  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F5F9] border border-dashed border-[#CBD5E1] text-[11px] font-semibold text-[#64748B] hover:bg-[#E2E8F0] transition-colors cursor-pointer">
        + {config.labelLong}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular border"
      style={{ background: config.bg, color: config.color, borderColor: config.border }}
    >
      {triggered && <Zap className="w-3 h-3" fill={config.color} strokeWidth={0} />}
      {config.label} {value.toLocaleString()}
    </span>
  );
}

export function WatchlistRow({
  security,
  onClick,
}: {
  security: Security;
  onClick: () => void;
}) {
  const positive = security.changePct >= 0;
  // Simulate occasional price flashes
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.15) {
        setFlash(Math.random() > 0.5 ? "up" : "down");
        setTimeout(() => setFlash(null), 800);
      }
    }, 4000 + Math.random() * 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-4 bg-white border border-border rounded-xl px-4 md:px-5 py-4 hover:border-[#0D2F55] hover:shadow-[0_4px_12px_rgba(13,47,85,0.08)] transition-all duration-150 text-left"
    >
      <GripVertical className="hidden md:block w-4 h-4 text-[#CBD5E1] opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-foreground truncate">{security.name}</div>
        <div className="text-[12px] text-muted-foreground font-mono tracking-wide">{security.symbol}</div>
      </div>

      <div className="hidden md:block">
        <span className="inline-block px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[11px] font-medium text-[#475569]">
          {security.sector}
        </span>
      </div>

      <div
        className={`text-right tabular px-2 py-1 rounded-md transition-colors ${
          flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""
        }`}
      >
        <div className="text-[20px] md:text-[22px] font-bold text-foreground leading-tight">
          {security.price.toLocaleString()}
        </div>
      </div>

      <div className="text-right min-w-[80px]">
        <div
          className={`text-[14px] font-bold tabular ${
            positive ? "text-[#16A34A]" : "text-[#DC2626]"
          }`}
        >
          {positive ? "▲" : "▼"} {Math.abs(security.changePct).toFixed(2)}%
        </div>
        <div className="text-[11px] text-muted-foreground tabular mt-0.5">
          {positive ? "+" : ""}
          {security.changeAbs.toFixed(2)}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1.5">
        <LevelPill kind="S" value={security.support} triggered={security.triggeredToday?.includes("S")} />
        <LevelPill kind="R" value={security.resistance} triggered={security.triggeredToday?.includes("R")} />
        <LevelPill kind="B" value={security.breakout} triggered={security.triggeredToday?.includes("B")} />
      </div>

      <span className="hidden xl:inline text-[12px] font-semibold text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
        View Details →
      </span>
    </button>
  );
}
