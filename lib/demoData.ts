// Dummy data for the on-page demo. Nothing here is real market data.
export type Impact = "H" | "M";
export type Ev = { day: number; t: string; impact: Impact; code: string; name: string; f: string; p: string };

export const DAYS = ["MON 19 OCT", "TUE 20 OCT", "WED 21 OCT", "THU 22 OCT", "FRI 23 OCT"];
export const CURRENCIES = ["USD", "CAD", "CHF", "EUR", "GBP"] as const;
export type Cur = (typeof CURRENCIES)[number];

export const EVENTS: Record<Cur, Ev[]> = {
  USD: [
    { day: 0, t: "10:00", impact: "M", code: "USD", name: "Existing Home Sales", f: "4.10M", p: "4.06M" },
    { day: 1, t: "08:30", impact: "H", code: "USD", name: "Core Retail Sales m/m", f: "0.3%", p: "0.2%" },
    { day: 1, t: "10:00", impact: "M", code: "USD", name: "Consumer Confidence", f: "98.4", p: "98.7" },
    { day: 2, t: "08:30", impact: "H", code: "USD", name: "CPI m/m", f: "0.2%", p: "0.1%" },
    { day: 2, t: "08:30", impact: "H", code: "USD", name: "Core CPI y/y", f: "2.9%", p: "2.9%" },
    { day: 3, t: "14:00", impact: "H", code: "USD", name: "FOMC Statement", f: "", p: "" },
    { day: 4, t: "08:30", impact: "M", code: "USD", name: "Jobless Claims", f: "231K", p: "228K" },
  ],
  CAD: [
    { day: 0, t: "08:30", impact: "H", code: "CAD", name: "CPI m/m", f: "0.2%", p: "-0.1%" },
    { day: 0, t: "08:30", impact: "H", code: "CAD", name: "Median CPI y/y", f: "2.0%", p: "2.0%" },
    { day: 0, t: "08:30", impact: "H", code: "CAD", name: "Trimmed CPI y/y", f: "1.9%", p: "1.9%" },
    { day: 0, t: "08:30", impact: "M", code: "CAD", name: "Common CPI y/y", f: "2.6%", p: "2.6%" },
    { day: 3, t: "08:30", impact: "M", code: "CAD", name: "Retail Sales m/m", f: "0.4%", p: "0.1%" },
  ],
  CHF: [
    { day: 1, t: "03:30", impact: "M", code: "CHF", name: "Trade Balance", f: "4.1B", p: "3.9B" },
    { day: 3, t: "03:30", impact: "H", code: "CHF", name: "SNB Policy Rate", f: "0.00%", p: "0.00%" },
  ],
  EUR: [
    { day: 0, t: "05:00", impact: "M", code: "EUR", name: "Current Account", f: "28B", p: "24B" },
    { day: 2, t: "04:00", impact: "H", code: "EUR", name: "German Ifo Index", f: "88.7", p: "87.4" },
    { day: 3, t: "08:15", impact: "H", code: "EUR", name: "ECB Rate Decision", f: "2.15%", p: "2.15%" },
  ],
  GBP: [
    { day: 1, t: "02:00", impact: "H", code: "GBP", name: "CPI y/y", f: "3.8%", p: "3.8%" },
    { day: 2, t: "02:00", impact: "M", code: "GBP", name: "Retail Sales m/m", f: "0.5%", p: "0.2%" },
    { day: 4, t: "02:00", impact: "M", code: "GBP", name: "Public Sector Net Borrowing", f: "13.2B", p: "11.9B" },
  ],
};

export const CHECKLIST = [
  { id: "bias", label: "Daily bias defined" },
  { id: "news", label: "News checked" },
  { id: "entry", label: "Entry model defined" },
  { id: "mno", label: "Midnight Open", options: ["Above", "Below"] },
  { id: "risk", label: "Risk per trade set" },
];

// Sessions of the Timeline picker, on the dummy New York clock (09:41). Windows are in minutes since midnight NY time.
export const SESSIONS = {
  NY: { name: "Opening", inWindow: true, nextIn: 0 },
  London: { name: "London", inWindow: false, nextIn: 16 * 3600 + 19 * 60 },
  Asia: { name: "Asia", inWindow: false, nextIn: 9 * 3600 + 19 * 60 },
} as const;
export type SessionKey = keyof typeof SESSIONS;

export const INSTRUMENTS = { MNQ: 2, NQ: 20, MES: 5, ES: 50 } as const;
export type Inst = keyof typeof INSTRUMENTS;
