export type Action = "BUY" | "WAIT" | "AVOID";

export interface SignalView {
  symbol: string;
  mode: "BREVE" | "LUNGO";
  action: Action;
  price_eur: number;
  score_total: number;
  confidence_0_5: number;
  entry_min: number;
  entry_max: number;
  stop: number;
  t1: number;
  t2: number;
  rr: number;
  reasons_simple: string[];
}

export interface PortfolioRow {
  symbol: string;
  weight: number;
  invested: number;
  current_value: number;
  pnl_eur: number;
  pnl_pct: number;
}
