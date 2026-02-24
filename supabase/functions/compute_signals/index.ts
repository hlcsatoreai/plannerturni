import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async () => {
  try {
    const { data: snapshots } = await supabase
      .from("market_snapshots")
      .select("symbol, price_eur, spread, depth_score, pump_24h_pct, ts")
      .order("ts", { ascending: false })
      .limit(300);

    const { data: fundamentals } = await supabase.from("fundamentals").select("symbol, data_missing, unlock_30d");
    const fundMap = new Map((fundamentals ?? []).map((f) => [f.symbol, f]));

    const marketRisk = 56; // placeholder from BTC trend/vol/dom/funding index
    const grouped = new Map<string, any>();
    for (const row of snapshots ?? []) if (!grouped.has(row.symbol)) grouped.set(row.symbol, row);

    const candidates: any[] = [];
    for (const [symbol, m] of grouped) {
      const f = fundMap.get(symbol);
      const liquidityGate = (m.spread ?? 1) < 0.004 && (m.depth_score ?? 0) > 40;
      if (!liquidityGate) continue;

      const antiFomoPenalty = (m.pump_24h_pct ?? 0) > 12 ? 15 : 0;
      const supplyPenalty = f?.data_missing ? 10 : (f?.unlock_30d ?? 0) > 3 ? 12 : 0;
      const timingOk = (m.spread ?? 1) < 0.003;

      let score = 72 - antiFomoPenalty - supplyPenalty + (timingOk ? 8 : -4);
      if (marketRisk >= 70) score -= 20;
      const confidence = Math.max(0, Math.min(5, Math.round(score / 20)));

      const action = marketRisk >= 70 ? "AVOID" : marketRisk >= 50 && score < 75 ? "WAIT" : "BUY";
      const stop = Number(m.price_eur) * 0.97;
      const t1 = Number(m.price_eur) * 1.04;
      const t2 = Number(m.price_eur) * 1.07;
      const rr = (t2 - Number(m.price_eur)) / (Number(m.price_eur) - stop);

      if (marketRisk >= 50 && marketRisk <= 69 && rr < 2.5) continue;

      candidates.push({
        symbol,
        mode: score > 75 ? "LUNGO" : "BREVE",
        action,
        score_total: Math.max(0, Math.min(100, score)),
        confidence_0_5: confidence,
        entry_min: Number(m.price_eur) * 0.995,
        entry_max: Number(m.price_eur) * 1.005,
        stop,
        t1,
        t2,
        rr,
        risk_score: marketRisk,
        reasons_simple: [
          "Liquidità accettabile",
          antiFomoPenalty ? "Pump 24h penalizzato" : "No euforia estrema",
          f?.data_missing ? "Dato mancante => penalità prudenziale" : "Supply risk sotto controllo"
        ]
      });
    }

    const top = candidates.sort((a, b) => b.score_total - a.score_total).slice(0, 4);
    if (top.length) await supabase.from("signals").insert(top);

    return new Response(JSON.stringify({ ok: true, picks: top.length, marketRisk }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("compute_signals error", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500 });
  }
});
