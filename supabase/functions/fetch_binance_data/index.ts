import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const BINANCE = "https://api.binance.com";

async function getJson(path: string) {
  const res = await fetch(`${BINANCE}${path}`);
  if (!res.ok) throw new Error(`Binance ${path} failed: ${res.status}`);
  return await res.json();
}

Deno.serve(async () => {
  try {
    const [exchangeInfo, ticker24h] = await Promise.all([
      getJson("/api/v3/exchangeInfo"),
      getJson("/api/v3/ticker/24hr")
    ]);

    const eurUsdtTicker = ticker24h.find((t: any) => t.symbol === "EURUSDT");
    const eurUsdt = Number(eurUsdtTicker?.lastPrice ?? 1);

    const activeSymbols = exchangeInfo.symbols.filter((s: any) => s.status === "TRADING");
    for (const s of activeSymbols) {
      await supabase.from("symbols").upsert({ symbol: s.symbol, base: s.baseAsset, quote: s.quoteAsset, active: true });
    }

    const tradable = activeSymbols.slice(0, 200);
    for (const s of tradable) {
      const t = ticker24h.find((x: any) => x.symbol === s.symbol);
      if (!t) continue;

      const priceRaw = Number(t.lastPrice);
      const priceEur = s.quoteAsset === "EUR" ? priceRaw : s.quoteAsset === "USDT" ? priceRaw / eurUsdt : null;
      if (!priceEur) continue;

      const depth = await getJson(`/api/v3/depth?symbol=${s.symbol}&limit=20`);
      const bestBid = Number(depth.bids?.[0]?.[0] ?? priceRaw);
      const bestAsk = Number(depth.asks?.[0]?.[0] ?? priceRaw);
      const spread = Math.abs(bestAsk - bestBid) / Math.max(bestBid, 1e-9);
      const depthScore = Math.min((depth.bids.length + depth.asks.length) / 40, 1) * 100;

      await supabase.from("market_snapshots").insert({
        symbol: s.symbol,
        price_eur: priceEur,
        volume_24h: Number(t.quoteVolume),
        spread,
        depth_score: depthScore,
        pump_24h_pct: Number(t.priceChangePercent),
        source: {
          endpoints: [
            `/api/v3/exchangeInfo`,
            `/api/v3/ticker/24hr`,
            `/api/v3/depth?symbol=${s.symbol}&limit=20`
          ],
          conversion: s.quoteAsset === "USDT" ? `price_eur=price_usdt/${eurUsdt}` : "native_eur_pair"
        }
      });
    }

    return new Response(JSON.stringify({ ok: true, symbols: tradable.length }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("fetch_binance_data error", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500 });
  }
});
