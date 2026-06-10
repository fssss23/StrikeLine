import { cn } from "@/lib/utils";

type StrikeLineProps = {
  variant?: "full" | "mark" | "inverse";
  className?: string;
};

export function StrikeLine({ variant = "full", className }: StrikeLineProps) {
  const isInverse = variant === "inverse";
  const isMark = variant === "mark";

  const lineColor = isInverse ? "#FFFFFF" : "#0D2F55";
  const strikeColor = isInverse ? "#7FB3D3" : "#2563EB";
  const textColor = isInverse ? "#FFFFFF" : "#0D2F55";

  const MarkSvg = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Horizontal line — solid, full-weight, square terminals */}
      <line
        x1="4"
        y1="16"
        x2="28"
        y2="16"
        stroke={lineColor}
        strokeWidth="3.5"
        strokeLinecap="butt"
      />
      {/* Diagonal strike — slightly thinner, extends beyond horizontal */}
      <line
        x1="3"
        y1="24"
        x2="29"
        y2="8"
        stroke={strikeColor}
        strokeWidth="2.5"
        strokeLinecap="butt"
      />
    </svg>
  );

  if (isMark) {
    return <div className={cn("inline-flex items-center", className)}>{MarkSvg}</div>;
  }

  return (
    <div className={cn("inline-flex items-center gap-[10px]", className)}>
      {MarkSvg}
      <span
        className="font-bold text-[18px] tracking-[-0.3px] select-none leading-none"
        style={{ color: textColor, fontFamily: "Inter, sans-serif" }}
      >
        StrikeLine
      </span>
    </div>
  );
}
