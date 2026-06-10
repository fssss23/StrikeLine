import { useState } from "react";
import { Search, X } from "lucide-react";
import { psxUniverse } from "@/lib/mock-data";
import { toast } from "sonner";

export function SearchBar() {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const results = q.trim()
    ? psxUniverse
        .filter(
          (s) =>
            s.symbol.toLowerCase().includes(q.toLowerCase()) ||
            s.name.toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder="Search PSX securities — type symbol or company name (e.g. OGDC, Engro, Lucky Cement)..."
          className="w-full h-[52px] pl-12 pr-12 bg-white border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {focused && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-border rounded-xl shadow-[0_12px_32px_rgba(15,23,42,0.08)] overflow-hidden animate-slide-in-up">
          <div className="max-h-[360px] overflow-y-auto">
            {results.map((r) => {
              const positive = r.changePct >= 0;
              return (
                <button
                  key={r.symbol}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toast.success(`${r.symbol} added to watchlist`);
                    setQ("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB] transition-colors text-left border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-foreground truncate">
                        <Highlight text={r.name} match={q} />
                      </span>
                      <span className="text-[11px] font-bold text-white bg-[#0D2F55] px-1.5 py-0.5 rounded-md tracking-wide">
                        <Highlight text={r.symbol} match={q} />
                      </span>
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{r.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold text-foreground tabular">
                      {r.price.toLocaleString()}
                    </div>
                    <div
                      className={`text-[12px] font-semibold tabular ${
                        positive ? "text-[#16A34A]" : "text-[#DC2626]"
                      }`}
                    >
                      {positive ? "▲" : "▼"} {Math.abs(r.changePct).toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2.5 bg-[#F8F9FB] border-t border-border text-[11px] text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-border rounded text-[10px] font-mono">Enter</kbd> to add to watchlist
          </div>
        </div>
      )}
    </div>
  );
}

function Highlight({ text, match }: { text: string; match: string }) {
  if (!match) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#0D2F55] font-bold">{text.slice(idx, idx + match.length)}</span>
      {text.slice(idx + match.length)}
    </>
  );
}
