export const mockSecurities = [
  { symbol: 'OGDC', name: 'Oil & Gas Development Co.', sector: 'Energy', price: 189.50, change: 1.24, changeAbs: 2.32, open: 187.20, high: 191.00, low: 186.80, volume: 4820000 },
  { symbol: 'LUCK', name: 'Lucky Cement Limited', sector: 'Cement', price: 1042.00, change: -0.82, changeAbs: 8.61, open: 1050.60, high: 1055.00, low: 1040.00, volume: 1500000 },
  { symbol: 'ENGRO', name: 'Engro Corporation', sector: 'Fertilizer', price: 334.75, change: 2.14, changeAbs: 7.01, open: 327.74, high: 336.00, low: 327.00, volume: 2200000 },
  { symbol: 'HBL', name: 'Habib Bank Limited', sector: 'Banking', price: 175.20, change: -0.31, changeAbs: 0.54, open: 175.74, high: 176.50, low: 174.80, volume: 3100000 },
  { symbol: 'MARI', name: 'Mari Petroleum Company', sector: 'Energy', price: 3210.00, change: 0.51, changeAbs: 16.27, open: 3193.73, high: 3215.00, low: 3190.00, volume: 850000 },
  { symbol: 'HUBC', name: 'Hub Power Company', sector: 'Energy', price: 142.30, change: 0.07, changeAbs: 0.10, open: 142.20, high: 143.00, low: 141.50, volume: 5500000 },
  { symbol: 'PSO', name: 'Pakistan State Oil', sector: 'Energy', price: 288.40, change: 1.10, changeAbs: 3.14, open: 285.26, high: 289.00, low: 284.50, volume: 1800000 },
  { symbol: 'PPL', name: 'Pakistan Petroleum Ltd', sector: 'Energy', price: 104.80, change: -0.55, changeAbs: 0.58, open: 105.38, high: 105.50, low: 104.50, volume: 4200000 },
  { symbol: 'UBL', name: 'United Bank Limited', sector: 'Banking', price: 245.10, change: 1.50, changeAbs: 3.62, open: 241.48, high: 246.00, low: 240.00, volume: 2800000 },
  { symbol: 'MCB', name: 'MCB Bank Limited', sector: 'Banking', price: 215.80, change: -0.20, changeAbs: 0.43, open: 216.23, high: 217.00, low: 215.00, volume: 1600000 },
  { symbol: 'NBP', name: 'National Bank of Pakistan', sector: 'Banking', price: 55.40, change: 0.85, changeAbs: 0.47, open: 54.93, high: 55.50, low: 54.50, volume: 5200000 },
  { symbol: 'BAFL', name: 'Bank Alfalah Limited', sector: 'Banking', price: 68.20, change: 1.15, changeAbs: 0.78, open: 67.42, high: 68.50, low: 67.00, volume: 3800000 },
  { symbol: 'EFERT', name: 'Engro Fertilizers', sector: 'Fertilizer', price: 148.90, change: 0.45, changeAbs: 0.67, open: 148.23, high: 149.50, low: 148.00, volume: 4100000 },
  { symbol: 'FFC', name: 'Fauji Fertilizer Company', sector: 'Fertilizer', price: 152.40, change: 0.90, changeAbs: 1.36, open: 151.04, high: 153.00, low: 150.50, volume: 2600000 },
  { symbol: 'MLCF', name: 'Maple Leaf Cement', sector: 'Cement', price: 42.15, change: -1.25, changeAbs: 0.53, open: 42.68, high: 42.80, low: 42.00, volume: 6800000 },
  { symbol: 'KOHC', name: 'Kohat Cement Company', sector: 'Cement', price: 285.50, change: 0.65, changeAbs: 1.84, open: 283.66, high: 286.00, low: 283.00, volume: 1200000 },
  { symbol: 'CHCC', name: 'Cherat Cement Company', sector: 'Cement', price: 195.80, change: 1.40, changeAbs: 2.70, open: 193.10, high: 196.50, low: 192.50, volume: 1800000 },
  { symbol: 'POL', name: 'Pakistan Oilfields', sector: 'Energy', price: 445.20, change: -0.45, changeAbs: 2.01, open: 447.21, high: 448.00, low: 444.00, volume: 950000 },
  { symbol: 'TRG', name: 'TRG Pakistan', sector: 'Technology', price: 82.50, change: 3.15, changeAbs: 2.52, open: 79.98, high: 83.00, low: 79.50, volume: 12500000 },
  { symbol: 'SYS', name: 'Systems Limited', sector: 'Technology', price: 540.60, change: 2.85, changeAbs: 14.98, open: 525.62, high: 542.00, low: 520.00, volume: 2100000 }
];

export const mockWatchlist = [
  {
    symbol: 'OGDC',
    support: { level: 185.00, enabled: true, lastTriggered: '2025-06-07T09:33:00Z' },
    resistance: { level: 195.00, enabled: true, lastTriggered: null },
    breakout: { level: 200.00, enabled: false, lastTriggered: null },
    cooldownMinutes: 240,
    bufferPct: 0.5
  },
  {
    symbol: 'ENGRO',
    support: { level: 320.00, enabled: true, lastTriggered: null },
    resistance: { level: 340.00, enabled: true, lastTriggered: null },
    breakout: { level: 350.00, enabled: false, lastTriggered: null },
    cooldownMinutes: 240,
    bufferPct: 0.5
  },
  {
    symbol: 'SYS',
    support: { level: 500.00, enabled: true, lastTriggered: null },
    resistance: { level: 550.00, enabled: true, lastTriggered: '2025-06-08T11:20:00Z' },
    breakout: { level: null, enabled: false, lastTriggered: null },
    cooldownMinutes: 240,
    bufferPct: 0.5
  },
  {
    symbol: 'TRG',
    support: { level: null, enabled: false, lastTriggered: null },
    resistance: { level: null, enabled: false, lastTriggered: null },
    breakout: { level: 85.00, enabled: true, lastTriggered: null },
    cooldownMinutes: 120,
    bufferPct: 0.5
  },
  {
    symbol: 'LUCK',
    support: { level: 1000.00, enabled: true, lastTriggered: null },
    resistance: { level: 1100.00, enabled: true, lastTriggered: null },
    breakout: { level: null, enabled: false, lastTriggered: null },
    cooldownMinutes: 240,
    bufferPct: 0.5
  },
  {
    symbol: 'HBL',
    support: { level: 170.00, enabled: true, lastTriggered: '2025-06-09T10:15:00Z' },
    resistance: { level: 185.00, enabled: false, lastTriggered: null },
    breakout: { level: 190.00, enabled: false, lastTriggered: null },
    cooldownMinutes: 240,
    bufferPct: 0.5
  }
];

export const mockAlertHistory = [
  { id: 1, name: 'Oil & Gas Development Co.', symbol: 'OGDC', type: 'support', level: 185.00, actualPrice: 184.80, time: '2025-06-07T09:33:00Z', read: true, status: 'delivered', channels: ['push', 'email'] },
  { id: 2, name: 'Systems Limited', symbol: 'SYS', type: 'resistance', level: 550.00, actualPrice: 551.20, time: '2025-06-08T11:20:00Z', read: false, status: 'failed', channels: ['push'] },
  { id: 3, name: 'Habib Bank Limited', symbol: 'HBL', type: 'support', level: 170.00, actualPrice: 169.50, time: '2025-06-09T10:15:00Z', read: false, status: 'delivered', channels: ['whatsapp'] },
];

export const mockCandlestickData = {
  '1D': [
  {
    "time": "09:15",
    "open": 187.2,
    "high": 187.4,
    "low": 186.7,
    "close": 187.4,
    "volume": 20000
  },
  {
    "time": "09:20",
    "open": 187.4,
    "high": 187.87,
    "low": 186.96,
    "close": 187.63,
    "volume": 104147
  },
  {
    "time": "09:25",
    "open": 187.63,
    "high": 188.29,
    "low": 187.36,
    "close": 187.87,
    "volume": 110929
  },
  {
    "time": "09:30",
    "open": 187.87,
    "high": 188.61,
    "low": 187.83,
    "close": 188.11,
    "volume": 34112
  },
  {
    "time": "09:35",
    "open": 188.11,
    "high": 188.79,
    "low": 187.9,
    "close": 188.34,
    "volume": 95680
  },
  {
    "time": "09:40",
    "open": 188.34,
    "high": 188.85,
    "low": 187.94,
    "close": 188.55,
    "volume": 115892
  },
  {
    "time": "09:45",
    "open": 188.55,
    "high": 188.8,
    "low": 188.06,
    "close": 188.73,
    "volume": 47941
  },
  {
    "time": "09:50",
    "open": 188.73,
    "high": 189.07,
    "low": 188.26,
    "close": 188.89,
    "volume": 85698
  },
  {
    "time": "09:55",
    "open": 188.89,
    "high": 189.41,
    "low": 188.56,
    "close": 189.03,
    "volume": 118935
  },
  {
    "time": "10:00",
    "open": 189.03,
    "high": 189.65,
    "low": 188.92,
    "close": 189.16,
    "volume": 61211
  },
  {
    "time": "10:05",
    "open": 189.16,
    "high": 189.78,
    "low": 189.02,
    "close": 189.3,
    "volume": 74402
  },
  {
    "time": "10:10",
    "open": 189.3,
    "high": 189.81,
    "low": 188.95,
    "close": 189.46,
    "volume": 119999
  },
  {
    "time": "10:15",
    "open": 189.46,
    "high": 189.79,
    "low": 188.98,
    "close": 189.65,
    "volume": 73657
  },
  {
    "time": "10:20",
    "open": 189.65,
    "high": 190,
    "low": 189.16,
    "close": 189.89,
    "volume": 62016
  },
  {
    "time": "10:25",
    "open": 189.89,
    "high": 190.52,
    "low": 189.51,
    "close": 190.19,
    "volume": 119060
  },
  {
    "time": "10:30",
    "open": 190.19,
    "high": 191.02,
    "low": 190.02,
    "close": 190.55,
    "volume": 85028
  },
  {
    "time": "10:35",
    "open": 190.55,
    "high": 191.46,
    "low": 190.48,
    "close": 190.97,
    "volume": 48790
  },
  {
    "time": "10:40",
    "open": 190.97,
    "high": 191.84,
    "low": 190.67,
    "close": 191.44,
    "volume": 116139
  },
  {
    "time": "10:45",
    "open": 191.44,
    "high": 192.17,
    "low": 190.98,
    "close": 191.96,
    "volume": 95098
  },
  {
    "time": "10:50",
    "open": 191.96,
    "high": 192.55,
    "low": 191.46,
    "close": 192.51,
    "volume": 34987
  },
  {
    "time": "10:55",
    "open": 192.51,
    "high": 193.34,
    "low": 192.09,
    "close": 193.07,
    "volume": 111294
  },
  {
    "time": "11:00",
    "open": 193.07,
    "high": 194.06,
    "low": 192.83,
    "close": 193.62,
    "volume": 103665
  },
  {
    "time": "11:05",
    "open": 193.62,
    "high": 194.63,
    "low": 193.62,
    "close": 194.13,
    "volume": 20885
  },
  {
    "time": "11:10",
    "open": 194.13,
    "high": 195.03,
    "low": 193.89,
    "close": 194.59,
    "volume": 104622
  },
  {
    "time": "11:15",
    "open": 194.59,
    "high": 195.25,
    "low": 194.17,
    "close": 194.98,
    "volume": 110557
  },
  {
    "time": "11:20",
    "open": 194.98,
    "high": 195.32,
    "low": 194.48,
    "close": 195.29,
    "volume": 33235
  },
  {
    "time": "11:25",
    "open": 195.29,
    "high": 195.72,
    "low": 194.84,
    "close": 195.51,
    "volume": 96255
  },
  {
    "time": "11:30",
    "open": 195.51,
    "high": 196.03,
    "low": 195.21,
    "close": 195.63,
    "volume": 115637
  },
  {
    "time": "11:35",
    "open": 195.63,
    "high": 196.16,
    "low": 195.56,
    "close": 195.66,
    "volume": 47090
  },
  {
    "time": "11:40",
    "open": 195.66,
    "high": 196.13,
    "low": 195.43,
    "close": 195.61,
    "volume": 86363
  },
  {
    "time": "11:45",
    "open": 195.61,
    "high": 195.94,
    "low": 195.1,
    "close": 195.48,
    "volume": 118803
  },
  {
    "time": "11:50",
    "open": 195.48,
    "high": 195.58,
    "low": 194.81,
    "close": 195.3,
    "volume": 60403
  },
  {
    "time": "11:55",
    "open": 195.3,
    "high": 195.44,
    "low": 194.6,
    "close": 195.08,
    "volume": 75142
  },
  {
    "time": "12:00",
    "open": 195.08,
    "high": 195.44,
    "low": 194.49,
    "close": 194.84,
    "volume": 119991
  },
  {
    "time": "12:05",
    "open": 194.84,
    "high": 195.32,
    "low": 194.45,
    "close": 194.59,
    "volume": 72908
  },
  {
    "time": "12:10",
    "open": 194.59,
    "high": 195.08,
    "low": 194.24,
    "close": 194.35,
    "volume": 62818
  },
  {
    "time": "12:15",
    "open": 194.35,
    "high": 194.73,
    "low": 193.8,
    "close": 194.13,
    "volume": 119177
  },
  {
    "time": "12:20",
    "open": 194.13,
    "high": 194.3,
    "low": 193.47,
    "close": 193.94,
    "volume": 84353
  },
  {
    "time": "12:25",
    "open": 193.94,
    "high": 194.01,
    "low": 193.28,
    "close": 193.77,
    "volume": 49636
  },
  {
    "time": "12:30",
    "open": 193.77,
    "high": 194.07,
    "low": 193.22,
    "close": 193.62,
    "volume": 116379
  },
  {
    "time": "12:35",
    "open": 193.62,
    "high": 194.08,
    "low": 193.29,
    "close": 193.49,
    "volume": 94511
  },
  {
    "time": "12:40",
    "open": 193.49,
    "high": 193.99,
    "low": 193.32,
    "close": 193.36,
    "volume": 35862
  },
  {
    "time": "12:45",
    "open": 193.36,
    "high": 193.78,
    "low": 192.94,
    "close": 193.21,
    "volume": 111652
  },
  {
    "time": "12:50",
    "open": 193.21,
    "high": 193.45,
    "low": 192.59,
    "close": 193.03,
    "volume": 103177
  },
  {
    "time": "12:55",
    "open": 193.03,
    "high": 193.03,
    "low": 192.31,
    "close": 192.81,
    "volume": 21770
  },
  {
    "time": "13:00",
    "open": 192.81,
    "high": 193.05,
    "low": 192.1,
    "close": 192.54,
    "volume": 105090
  },
  {
    "time": "13:05",
    "open": 192.54,
    "high": 192.96,
    "low": 191.94,
    "close": 192.21,
    "volume": 110178
  },
  {
    "time": "13:10",
    "open": 192.21,
    "high": 192.71,
    "low": 191.79,
    "close": 191.82,
    "volume": 32357
  },
  {
    "time": "13:15",
    "open": 191.82,
    "high": 192.27,
    "low": 191.16,
    "close": 191.37,
    "volume": 96825
  },
  {
    "time": "13:20",
    "open": 191.37,
    "high": 191.67,
    "low": 190.47,
    "close": 190.87,
    "volume": 115375
  },
  {
    "time": "13:25",
    "open": 190.87,
    "high": 190.94,
    "low": 189.83,
    "close": 190.33,
    "volume": 46237
  },
  {
    "time": "13:30",
    "open": 190.33,
    "high": 190.51,
    "low": 189.31,
    "close": 189.78,
    "volume": 87022
  },
  {
    "time": "13:35",
    "open": 189.78,
    "high": 190.16,
    "low": 188.91,
    "close": 189.23,
    "volume": 118662
  },
  {
    "time": "13:40",
    "open": 189.23,
    "high": 189.72,
    "low": 188.6,
    "close": 188.7,
    "volume": 59592
  },
  {
    "time": "13:45",
    "open": 188.7,
    "high": 189.18,
    "low": 188.06,
    "close": 188.21,
    "volume": 75878
  },
  {
    "time": "13:50",
    "open": 188.21,
    "high": 188.56,
    "low": 187.43,
    "close": 187.79,
    "volume": 119975
  },
  {
    "time": "13:55",
    "open": 187.79,
    "high": 187.93,
    "low": 186.97,
    "close": 187.45,
    "volume": 72155
  },
  {
    "time": "14:00",
    "open": 187.45,
    "high": 187.56,
    "low": 186.7,
    "close": 187.19,
    "volume": 63616
  },
  {
    "time": "14:05",
    "open": 187.19,
    "high": 187.52,
    "low": 186.66,
    "close": 187.03,
    "volume": 119287
  },
  {
    "time": "14:10",
    "open": 187.03,
    "high": 187.5,
    "low": 186.79,
    "close": 186.96,
    "volume": 83673
  },
  {
    "time": "14:15",
    "open": 186.96,
    "high": 187.47,
    "low": 186.88,
    "close": 186.98,
    "volume": 50481
  },
  {
    "time": "14:20",
    "open": 186.98,
    "high": 187.48,
    "low": 186.68,
    "close": 187.08,
    "volume": 116611
  },
  {
    "time": "14:25",
    "open": 187.08,
    "high": 187.44,
    "low": 186.62,
    "close": 187.24,
    "volume": 93918
  },
  {
    "time": "14:30",
    "open": 187.24,
    "high": 187.49,
    "low": 186.74,
    "close": 187.45,
    "volume": 36735
  },
  {
    "time": "14:35",
    "open": 187.45,
    "high": 187.96,
    "low": 187.03,
    "close": 187.68,
    "volume": 112002
  },
  {
    "time": "14:40",
    "open": 187.68,
    "high": 188.37,
    "low": 187.45,
    "close": 187.93,
    "volume": 102682
  },
  {
    "time": "14:45",
    "open": 187.93,
    "high": 188.67,
    "low": 187.92,
    "close": 188.17,
    "volume": 22655
  },
  {
    "time": "14:50",
    "open": 188.17,
    "high": 188.83,
    "low": 187.92,
    "close": 188.39,
    "volume": 105551
  },
  {
    "time": "14:55",
    "open": 188.39,
    "high": 188.85,
    "low": 187.97,
    "close": 188.59,
    "volume": 109792
  },
  {
    "time": "15:00",
    "open": 188.59,
    "high": 188.8,
    "low": 188.09,
    "close": 188.77,
    "volume": 31478
  },
  {
    "time": "15:05",
    "open": 188.77,
    "high": 189.13,
    "low": 188.32,
    "close": 188.92,
    "volume": 97389
  },
  {
    "time": "15:10",
    "open": 188.92,
    "high": 189.46,
    "low": 188.63,
    "close": 189.06,
    "volume": 115105
  },
  {
    "time": "15:15",
    "open": 189.06,
    "high": 189.69,
    "low": 189,
    "close": 189.19,
    "volume": 45382
  },
  {
    "time": "15:20",
    "open": 189.19,
    "high": 189.8,
    "low": 189.01,
    "close": 189.33,
    "volume": 87677
  },
  {
    "time": "15:25",
    "open": 189.33,
    "high": 189.81,
    "low": 188.95,
    "close": 189.49,
    "volume": 118514
  },
  {
    "time": "15:30",
    "open": 189.49,
    "high": 189.79,
    "low": 189,
    "close": 189.69,
    "volume": 58778
  },
  {
    "time": "15:35",
    "open": 189.69,
    "high": 190.09,
    "low": 189.21,
    "close": 189.94,
    "volume": 76610
  },
  {
    "time": "15:40",
    "open": 189.94,
    "high": 190.61,
    "low": 189.59,
    "close": 190.25,
    "volume": 119952
  }
],
  '1W': [
  {
    "time": "Mon 09:15",
    "open": 185,
    "high": 185.5,
    "low": 184,
    "close": 185.5,
    "volume": 100000
  },
  {
    "time": "Mon 10:15",
    "open": 185.5,
    "high": 186.76,
    "low": 184.74,
    "close": 186.12,
    "volume": 520735
  },
  {
    "time": "Mon 11:15",
    "open": 186.12,
    "high": 187.77,
    "low": 185.95,
    "close": 186.78,
    "volume": 554648
  },
  {
    "time": "Mon 12:15",
    "open": 186.78,
    "high": 188.27,
    "low": 186.28,
    "close": 187.41,
    "volume": 170560
  },
  {
    "time": "Mon 13:15",
    "open": 187.41,
    "high": 188.3,
    "low": 186.47,
    "close": 187.97,
    "volume": 478401
  },
  {
    "time": "Mon 14:15",
    "open": 187.97,
    "high": 188.79,
    "low": 187.03,
    "close": 188.44,
    "volume": 579462
  },
  {
    "time": "Mon 15:15",
    "open": 188.44,
    "high": 189.69,
    "low": 187.95,
    "close": 188.82,
    "volume": 239707
  },
  {
    "time": "Tue 09:15",
    "open": 188.82,
    "high": 190.12,
    "low": 188.63,
    "close": 189.14,
    "volume": 428493
  },
  {
    "time": "Tue 10:15",
    "open": 189.14,
    "high": 190.07,
    "low": 188.36,
    "close": 189.44,
    "volume": 594679
  },
  {
    "time": "Tue 11:15",
    "open": 189.44,
    "high": 189.79,
    "low": 188.44,
    "close": 189.77,
    "volume": 306059
  },
  {
    "time": "Tue 12:15",
    "open": 189.77,
    "high": 190.83,
    "low": 189.02,
    "close": 190.17,
    "volume": 372010
  },
  {
    "time": "Tue 13:15",
    "open": 190.17,
    "high": 191.65,
    "low": 190.02,
    "close": 190.66,
    "volume": 599995
  },
  {
    "time": "Tue 14:15",
    "open": 190.66,
    "high": 192.09,
    "low": 190.14,
    "close": 191.24,
    "volume": 368286
  },
  {
    "time": "Tue 15:15",
    "open": 191.24,
    "high": 192.21,
    "low": 190.29,
    "close": 191.89,
    "volume": 310083
  },
  {
    "time": "Wed 09:15",
    "open": 191.89,
    "high": 192.92,
    "low": 190.96,
    "close": 192.55,
    "volume": 595303
  },
  {
    "time": "Wed 10:15",
    "open": 192.55,
    "high": 194.02,
    "low": 192.07,
    "close": 193.14,
    "volume": 425143
  },
  {
    "time": "Wed 11:15",
    "open": 193.14,
    "high": 194.57,
    "low": 192.94,
    "close": 193.59,
    "volume": 243951
  },
  {
    "time": "Wed 12:15",
    "open": 193.59,
    "high": 194.44,
    "low": 192.8,
    "close": 193.82,
    "volume": 580698
  },
  {
    "time": "Wed 13:15",
    "open": 193.82,
    "high": 193.85,
    "low": 192.77,
    "close": 193.77,
    "volume": 475493
  },
  {
    "time": "Wed 14:15",
    "open": 193.77,
    "high": 194.44,
    "low": 192.67,
    "close": 193.41,
    "volume": 174938
  },
  {
    "time": "Wed 15:15",
    "open": 193.41,
    "high": 194.4,
    "low": 192.59,
    "close": 192.73,
    "volume": 556472
  },
  {
    "time": "Thu 09:15",
    "open": 192.73,
    "high": 193.58,
    "low": 191.24,
    "close": 191.77,
    "volume": 518327
  },
  {
    "time": "Thu 10:15",
    "open": 191.77,
    "high": 192.07,
    "low": 189.65,
    "close": 190.6,
    "volume": 104425
  },
  {
    "time": "Thu 11:15",
    "open": 190.6,
    "high": 190.98,
    "low": 188.4,
    "close": 189.32,
    "volume": 523110
  },
  {
    "time": "Thu 12:15",
    "open": 189.32,
    "high": 190.21,
    "low": 187.57,
    "close": 188.03,
    "volume": 552789
  },
  {
    "time": "Thu 13:15",
    "open": 188.03,
    "high": 189.01,
    "low": 186.62,
    "close": 186.84,
    "volume": 166175
  },
  {
    "time": "Thu 14:15",
    "open": 186.84,
    "high": 187.44,
    "low": 185.05,
    "close": 185.85,
    "volume": 481279
  },
  {
    "time": "Thu 15:15",
    "open": 185.85,
    "high": 185.9,
    "low": 184.13,
    "close": 185.13,
    "volume": 578187
  },
  {
    "time": "Fri 09:15",
    "open": 185.13,
    "high": 185.81,
    "low": 184,
    "close": 184.73,
    "volume": 235452
  },
  {
    "time": "Fri 10:15",
    "open": 184.73,
    "high": 185.72,
    "low": 184.52,
    "close": 184.64,
    "volume": 431816
  },
  {
    "time": "Fri 11:15",
    "open": 184.64,
    "high": 185.68,
    "low": 184.09,
    "close": 184.84,
    "volume": 594015
  },
  {
    "time": "Fri 12:15",
    "open": 184.84,
    "high": 185.56,
    "low": 183.88,
    "close": 185.27,
    "volume": 302018
  },
  {
    "time": "Fri 13:15",
    "open": 185.27,
    "high": 186.25,
    "low": 184.35,
    "close": 185.85,
    "volume": 375713
  },
  {
    "time": "Fri 14:15",
    "open": 185.85,
    "high": 187.4,
    "low": 185.4,
    "close": 186.5,
    "volume": 599955
  },
  {
    "time": "Fri 15:15",
    "open": 186.5,
    "high": 188.12,
    "low": 186.26,
    "close": 187.15,
    "volume": 364541
  }
],
  '1M': [
  {
    "time": "08 May",
    "open": 184,
    "high": 185.7,
    "low": 183,
    "close": 184.2,
    "volume": 1199999
  },
  {
    "time": "09 May",
    "open": 184.2,
    "high": 185.5,
    "low": 183.7,
    "close": 185,
    "volume": 1800000
  },
  {
    "time": "10 May",
    "open": 185,
    "high": 185.5,
    "low": 183.8,
    "close": 184.8,
    "volume": 1199999
  },
  {
    "time": "11 May",
    "open": 184.8,
    "high": 187,
    "low": 184.3,
    "close": 185.5,
    "volume": 1699999
  },
  {
    "time": "12 May",
    "open": 185.5,
    "high": 186.5,
    "low": 184.5,
    "close": 186,
    "volume": 1500000
  },
  {
    "time": "15 May",
    "open": 186,
    "high": 186.5,
    "low": 184.7,
    "close": 185.2,
    "volume": 1800000
  },
  {
    "time": "16 May",
    "open": 185.2,
    "high": 187.3,
    "low": 184.2,
    "close": 185.8,
    "volume": 1600000
  },
  {
    "time": "17 May",
    "open": 185.8,
    "high": 187.5,
    "low": 185.3,
    "close": 187,
    "volume": 2199999
  },
  {
    "time": "18 May",
    "open": 187,
    "high": 190,
    "low": 186,
    "close": 189.5,
    "volume": 3500000
  },
  {
    "time": "19 May",
    "open": 189.5,
    "high": 193.5,
    "low": 189,
    "close": 192,
    "volume": 3500000
  },
  {
    "time": "22 May",
    "open": 192,
    "high": 195,
    "low": 191,
    "close": 194.5,
    "volume": 3500000
  },
  {
    "time": "23 May",
    "open": 194.5,
    "high": 196.7,
    "low": 194,
    "close": 196.2,
    "volume": 2699999
  },
  {
    "time": "24 May",
    "open": 196.2,
    "high": 197.7,
    "low": 194.8,
    "close": 195.8,
    "volume": 1399999
  },
  {
    "time": "25 May",
    "open": 195.8,
    "high": 197,
    "low": 195.3,
    "close": 196.5,
    "volume": 1699999
  },
  {
    "time": "26 May",
    "open": 196.5,
    "high": 197,
    "low": 194,
    "close": 195,
    "volume": 2500000
  },
  {
    "time": "29 May",
    "open": 195,
    "high": 196.5,
    "low": 193,
    "close": 193.5,
    "volume": 2500000
  },
  {
    "time": "30 May",
    "open": 193.5,
    "high": 194,
    "low": 190,
    "close": 191,
    "volume": 3500000
  },
  {
    "time": "31 May",
    "open": 191,
    "high": 191.5,
    "low": 189,
    "close": 189.5,
    "volume": 2500000
  },
  {
    "time": "01 Jun",
    "open": 189.5,
    "high": 191.7,
    "low": 188.5,
    "close": 190.2,
    "volume": 1699999
  },
  {
    "time": "02 Jun",
    "open": 190.2,
    "high": 190.7,
    "low": 189.3,
    "close": 189.8,
    "volume": 1399999
  },
  {
    "time": "05 Jun",
    "open": 189.8,
    "high": 191.5,
    "low": 188.8,
    "close": 191,
    "volume": 2199999
  },
  {
    "time": "06 Jun",
    "open": 191,
    "high": 192.5,
    "low": 190,
    "close": 190.5,
    "volume": 1500000
  }
]
};

export const mockSecurityDetails={
  OGDC:{fullName:'Oil & Gas Development Company Limited',sector:'Energy',exchange:'PSX Main Board',marketCap:'823.4B',peRatio:'8.2x',weekHigh52:'198.50',weekLow52:'161.20',avgVolume:'4.2M',lastDividend:'PKR 6.00 (Mar 2025)'},
  LUCK:{fullName:'Lucky Cement Limited',sector:'Cement',exchange:'PSX Main Board',marketCap:'337.1B',peRatio:'9.4x',weekHigh52:'1100.00',weekLow52:'850.00',avgVolume:'1.5M',lastDividend:'PKR 18.00 (Oct 2024)'},
  ENGRO:{fullName:'Engro Corporation',sector:'Fertilizer',exchange:'PSX Main Board',marketCap:'179.5B',peRatio:'6.1x',weekHigh52:'350.00',weekLow52:'280.00',avgVolume:'2.2M',lastDividend:'PKR 46.00 (Dec 2024)'},
  HBL:{fullName:'Habib Bank Limited',sector:'Banking',exchange:'PSX Main Board',marketCap:'257.0B',peRatio:'4.8x',weekHigh52:'195.00',weekLow52:'135.00',avgVolume:'3.1M',lastDividend:'PKR 9.75 (Feb 2025)'},
  MARI:{fullName:'Mari Petroleum Company',sector:'Energy',exchange:'PSX Main Board',marketCap:'428.2B',peRatio:'5.6x',weekHigh52:'3300.00',weekLow52:'2500.00',avgVolume:'850K',lastDividend:'PKR 147.00 (Aug 2024)'},
  HUBC:{fullName:'Hub Power Company',sector:'Energy',exchange:'PSX Main Board',marketCap:'184.6B',peRatio:'3.9x',weekHigh52:'155.00',weekLow52:'110.00',avgVolume:'5.5M',lastDividend:'PKR 8.50 (Sep 2024)'},
};
