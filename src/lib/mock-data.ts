export type Security = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  changeAbs: number;
  support?: number;
  resistance?: number;
  breakout?: number;
  triggeredToday?: Array<"S" | "R" | "B">;
};

export const watchlist: Security[] = [
  {
    symbol: "OGDC", name: "Oil & Gas Dev. Co.", sector: "Energy",
    price: 189.5, changePct: 1.24, changeAbs: 2.32,
    support: 185, resistance: 195, breakout: 200, triggeredToday: ["S"],
  },
  {
    symbol: "LUCK", name: "Lucky Cement", sector: "Cement",
    price: 1042, changePct: -0.82, changeAbs: -8.6,
    support: 1020, resistance: 1060,
  },
  {
    symbol: "ENGRO", name: "Engro Corporation", sector: "Chemicals",
    price: 334.75, changePct: 2.14, changeAbs: 7.01,
    resistance: 340,
  },
  {
    symbol: "HBL", name: "Habib Bank Limited", sector: "Commercial Banks",
    price: 175.2, changePct: -0.31, changeAbs: -0.54,
    support: 170, resistance: 180, breakout: 185, triggeredToday: ["R", "B"],
  },
  {
    symbol: "MARI", name: "Mari Petroleum", sector: "Energy",
    price: 3210, changePct: 0.51, changeAbs: 16.3,
  },
  {
    symbol: "HUBC", name: "Hub Power Co.", sector: "Power Generation",
    price: 142.3, changePct: 0.07, changeAbs: 0.1,
    support: 138,
  },
];

export type AlertRecord = {
  id: string;
  timestamp: string;
  symbol: string;
  name: string;
  type: "SUPPORT" | "RESISTANCE" | "BREAKOUT";
  level: number;
  actual: number;
  channels: Array<"push" | "whatsapp" | "email">;
  status: "Delivered" | "Failed";
  direction: "above" | "below";
};

export const alertHistory: AlertRecord[] = [
  { id: "a1", timestamp: "Today · 14:32", symbol: "OGDC", name: "Oil & Gas Dev. Co.", type: "SUPPORT", level: 185.0, actual: 184.92, channels: ["push", "whatsapp"], status: "Delivered", direction: "below" },
  { id: "a2", timestamp: "Today · 11:14", symbol: "HBL", name: "Habib Bank Limited", type: "RESISTANCE", level: 180.0, actual: 180.15, channels: ["push"], status: "Delivered", direction: "above" },
  { id: "a3", timestamp: "Mon 08 Jun · 15:01", symbol: "LUCK", name: "Lucky Cement", type: "SUPPORT", level: 1020.0, actual: 1019.4, channels: ["email"], status: "Delivered", direction: "below" },
  { id: "a4", timestamp: "Mon 08 Jun · 10:45", symbol: "ENGRO", name: "Engro Corporation", type: "RESISTANCE", level: 340.0, actual: 340.3, channels: ["push"], status: "Failed", direction: "above" },
  { id: "a5", timestamp: "Sun 07 Jun · 13:20", symbol: "HBL", name: "Habib Bank Limited", type: "BREAKOUT", level: 185.0, actual: 185.2, channels: ["push", "whatsapp"], status: "Delivered", direction: "above" },
  { id: "a6", timestamp: "Sun 07 Jun · 09:33", symbol: "OGDC", name: "Oil & Gas Dev. Co.", type: "RESISTANCE", level: 195.0, actual: 195.05, channels: ["push"], status: "Delivered", direction: "above" },
];

// Pool of searchable PSX securities (not in watchlist by default).
export const psxUniverse: Array<Omit<Security, "support" | "resistance" | "breakout" | "triggeredToday">> = [
  ...watchlist.map(({ support, resistance, breakout, triggeredToday, ...rest }) => rest),
  { symbol: "PSO", name: "Pakistan State Oil", sector: "Energy", price: 224.6, changePct: 0.92, changeAbs: 2.05 },
  { symbol: "MCB", name: "MCB Bank Limited", sector: "Commercial Banks", price: 218.4, changePct: -0.45, changeAbs: -0.99 },
  { symbol: "UBL", name: "United Bank Limited", sector: "Commercial Banks", price: 252.3, changePct: 1.05, changeAbs: 2.62 },
  { symbol: "PPL", name: "Pakistan Petroleum", sector: "Energy", price: 124.85, changePct: -0.22, changeAbs: -0.28 },
  { symbol: "FFC", name: "Fauji Fertilizer Co.", sector: "Fertilizer", price: 376.1, changePct: 1.41, changeAbs: 5.24 },
  { symbol: "DGKC", name: "D.G. Khan Cement", sector: "Cement", price: 138.55, changePct: -1.12, changeAbs: -1.57 },
  { symbol: "TRG", name: "TRG Pakistan", sector: "Technology", price: 62.4, changePct: 3.21, changeAbs: 1.94 },
  { symbol: "SYS", name: "Systems Limited", sector: "Technology", price: 488.7, changePct: 1.88, changeAbs: 9.02 },
];

// Generate plausible OHLC candles for a chart.
export function generateCandles(basePrice: number, count = 30) {
  const out: Array<{ t: string; o: number; h: number; l: number; c: number }> = [];
  let prev = basePrice * 0.97;
  for (let i = 0; i < count; i++) {
    const drift = (Math.sin(i / 3) + Math.random() - 0.4) * basePrice * 0.008;
    const o = prev;
    const c = Math.max(0.01, o + drift);
    const h = Math.max(o, c) + Math.random() * basePrice * 0.004;
    const l = Math.min(o, c) - Math.random() * basePrice * 0.004;
    out.push({ t: `${i}`, o, h, l, c });
    prev = c;
  }
  // anchor last close to current price
  out[out.length - 1].c = basePrice;
  out[out.length - 1].h = Math.max(out[out.length - 1].h, basePrice);
  out[out.length - 1].l = Math.min(out[out.length - 1].l, basePrice);
  return out;
}

export const kse100 = { value: 46218.4, changePct: 0.42 };

export const tickerStrip = [
  { s: "OGDC", p: 189.5, c: 1.2 },
  { s: "LUCK", p: 1042, c: -0.8 },
  { s: "ENGRO", p: 334.75, c: 2.1 },
  { s: "HBL", p: 175.2, c: -0.3 },
  { s: "MARI", p: 3210, c: 0.5 },
  { s: "PSO", p: 224.6, c: 0.9 },
  { s: "FFC", p: 376.1, c: 1.4 },
  { s: "SYS", p: 488.7, c: 1.9 },
];

export function formatPKR(n: number, opts: { decimals?: number } = {}) {
  return n.toLocaleString("en-PK", {
    minimumFractionDigits: opts.decimals ?? 2,
    maximumFractionDigits: opts.decimals ?? 2,
  });
}
