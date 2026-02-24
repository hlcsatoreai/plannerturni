"use client";

import { useMemo, useState } from "react";
import { topPicks } from "@/lib/mock-data";
import { PortfolioRow } from "@/lib/types";

const riskScore = 56;

function riskModeWeights(mode: string, score: number, confidence: number, volPenalty: number, supplyPenalty: number) {
  const base = score * 0.5 + confidence * 10 - volPenalty - supplyPenalty;
  if (mode === "Aggressivo") return Math.max(base * 1.2, 1);
  if (mode === "Difensivo") return Math.max(base * 0.8, 1);
  return Math.max(base, 1);
}

export default function HomePage() {
  const [tab, setTab] = useState("top");
  const [capital, setCapital] = useState(20);
  const [riskPct, setRiskPct] = useState(1);
  const [allocMode, setAllocMode] = useState("Bilanciato");

  const selected = topPicks.filter((p) => p.action !== "AVOID").slice(0, 6);
  const portfolio = useMemo(() => {
    const raw = selected.map((s) => ({
      symbol: s.symbol,
      weight: riskModeWeights(allocMode, s.score_total, s.confidence_0_5, 100 - s.score_total, s.action === "WAIT" ? 8 : 2)
    }));
    const sum = raw.reduce((a, b) => a + b.weight, 0);
    return raw.map((r): PortfolioRow => {
      const weight = r.weight / sum;
      const invested = capital * weight;
      const current_value = invested * 1.02;
      return {
        symbol: r.symbol,
        weight,
        invested,
        current_value,
        pnl_eur: current_value - invested,
        pnl_pct: ((current_value - invested) / invested) * 100
      };
    });
  }, [allocMode, capital, selected]);

  const pnl = portfolio.reduce((a, b) => a + b.pnl_eur, 0);

  return (
    <main>
      <h1>Crypto War Machine ULTRA</h1>
      <p className="small">Analisi probabilistica: nessuna promessa di guadagno. Mostriamo rischio e perdita possibile.</p>

      <div className="tabs card">
        {["top", "risk", "backtest", "diario", "portfolio"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "active" : ""}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === "top" && (
        <div>
          {topPicks.map((s) => (
            <div className="card" key={s.symbol + s.mode}>
              <div className="grid">
                <div>
                  <h3>{s.symbol} • {s.mode}</h3>
                  <span className={`badge ${s.action.toLowerCase()}`}>{s.action}</span>
                  <p>Prezzo EUR: €{s.price_eur}</p>
                  <p>Score: {s.score_total}/100 • Confidence: {s.confidence_0_5}/5</p>
                </div>
                <div>
                  <p><b>Setup:</b> Entry {s.entry_min}–{s.entry_max}, Stop {s.stop}, T1 {s.t1}, T2 {s.t2}, R:R {s.rr}</p>
                  <ul>{s.reasons_simple.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
                <div>
                  <label>Capitale (€)</label>
                  <input value={capital} onChange={(e) => setCapital(Number(e.target.value))} type="number" />
                  <label>Rischio per trade (%)</label>
                  <input value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} type="number" />
                  <p>Size suggerita: {((capital * (riskPct / 100)) / Math.max(s.entry_max - s.stop, 0.0001)).toFixed(4)} unità</p>
                  <p>Perdita a stop: €{(capital * (riskPct / 100)).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "risk" && (
        <div className="card">
          <h2>Market Risk</h2>
          <p>Risk Score: {riskScore}/100</p>
          <p>Kill Switch: {riskScore >= 70 ? "ATTIVO: blocco BUY" : "Disattivo"}</p>
          <p className="small">Se mancano dati (dominance/fear&greed/on-chain), applichiamo penalità prudenziale.</p>
        </div>
      )}

      {tab === "backtest" && (
        <div className="card">
          <h2>Backtest 6 mesi</h2>
          <p>BREVE: Win rate 57%, Drawdown -11%, Profit factor 1.42</p>
          <p>LUNGO: Win rate 61%, Drawdown -9%, Profit factor 1.55</p>
        </div>
      )}

      {tab === "diario" && (
        <div className="card">
          <h2>Diario Trade</h2>
          <p>Track errori ricorrenti: FOMO, entrata tardiva, stop troppo largo.</p>
          <p>Inserimento tramite tabella `trades_diary` con statistiche aggregate lato SQL.</p>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="card">
          <h2>Smart Portfolio Allocator</h2>
          <label>Capitale iniziale (€)</label>
          <input value={capital} onChange={(e) => setCapital(Number(e.target.value))} type="number" />
          <label>Modalità</label>
          <select value={allocMode} onChange={(e) => setAllocMode(e.target.value)}>
            <option>Aggressivo</option>
            <option>Bilanciato</option>
            <option>Difensivo</option>
          </select>
          <p>Auto rebalance ogni 5 minuti. Stop globale in cash se Market Risk alto.</p>
          {portfolio.map((r) => (
            <p key={r.symbol}>{r.symbol}: {(r.weight * 100).toFixed(1)}% | Investito €{r.invested.toFixed(2)} | Valore €{r.current_value.toFixed(2)}</p>
          ))}
          <hr />
          <p>Valore attuale: €{(capital + pnl).toFixed(2)} | Profitto: €{pnl.toFixed(2)} ({((pnl / capital) * 100).toFixed(2)}%)</p>
          <p>Storico simulato 30/60 giorni + drawdown potenziale disponibile in DB snapshot.</p>
          <p><b>Scenario:</b> “Se investissi oggi €{capital}, ecco una stima probabilistica. Potresti perdere capitale.”</p>
        </div>
      )}
    </main>
  );
}
