import { SignalView } from "./types";

export const topPicks: SignalView[] = [
  {
    symbol: "BTCEUR",
    mode: "BREVE",
    action: "BUY",
    price_eur: 60200,
    score_total: 81,
    confidence_0_5: 4,
    entry_min: 59800,
    entry_max: 60300,
    stop: 58900,
    t1: 61500,
    t2: 62800,
    rr: 2.7,
    reasons_simple: ["Trend rialzista pulito", "Volumi reali in aumento", "News positive senza euforia"]
  },
  {
    symbol: "ETHEUR",
    mode: "LUNGO",
    action: "BUY",
    price_eur: 3200,
    score_total: 78,
    confidence_0_5: 4,
    entry_min: 3150,
    entry_max: 3220,
    stop: 3050,
    t1: 3400,
    t2: 3560,
    rr: 2.5,
    reasons_simple: ["Fondamentali solidi", "Supply risk contenuto", "Breakout confermato"]
  },
  {
    symbol: "SOLUSDT",
    mode: "BREVE",
    action: "WAIT",
    price_eur: 154,
    score_total: 66,
    confidence_0_5: 3,
    entry_min: 150,
    entry_max: 153,
    stop: 146,
    t1: 161,
    t2: 166,
    rr: 2.1,
    reasons_simple: ["Volatilità elevata", "Setup buono ma non ottimo", "Funding da monitorare"]
  },
  {
    symbol: "ADAEUR",
    mode: "LUNGO",
    action: "AVOID",
    price_eur: 0.43,
    score_total: 45,
    confidence_0_5: 2,
    entry_min: 0.41,
    entry_max: 0.43,
    stop: 0.39,
    t1: 0.47,
    t2: 0.51,
    rr: 1.8,
    reasons_simple: ["Unlock vicino (penalità)", "Trend debole", "Rischio mercato medio-alto"]
  }
];
