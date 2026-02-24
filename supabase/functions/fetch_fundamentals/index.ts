import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async () => {
  try {
    const { data: symbols } = await supabase.from("symbols").select("symbol,base").limit(100);
    for (const s of symbols ?? []) {
      const cg = await fetch(`https://api.coingecko.com/api/v3/coins/${s.base.toLowerCase()}`).then((r) => r.ok ? r.json() : null);
      const missing = !cg;
      await supabase.from("fundamentals").upsert({
        symbol: s.symbol,
        marketcap: cg?.market_data?.market_cap?.eur ?? null,
        circ_supply: cg?.market_data?.circulating_supply ?? null,
        total_supply: cg?.market_data?.total_supply ?? null,
        max_supply: cg?.market_data?.max_supply ?? null,
        unlock_7d: null,
        unlock_30d: null,
        inflation: null,
        data_missing: missing
      });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("fetch_fundamentals error", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500 });
  }
});
