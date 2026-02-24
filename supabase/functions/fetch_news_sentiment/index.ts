import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const POSITIVE = ["surge", "adoption", "approved", "partnership", "growth"];
const NEGATIVE = ["hack", "lawsuit", "ban", "exploit", "liquidation"];

function score(title: string) {
  const t = title.toLowerCase();
  const pos = POSITIVE.filter((w) => t.includes(w)).length;
  const neg = NEGATIVE.filter((w) => t.includes(w)).length;
  return Math.max(-1, Math.min(1, (pos - neg) / 2));
}

Deno.serve(async () => {
  try {
    const key = Deno.env.get("CRYPTOPANIC_API_KEY");
    const url = key
      ? `https://cryptopanic.com/api/v1/posts/?auth_token=${key}&public=true`
      : "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

    const payload = await fetch(url).then((r) => r.json());
    const rows = (payload.results ?? payload.Data ?? []).slice(0, 50).map((n: any) => ({
      source: n.source?.title ?? n.source_info?.name ?? "aggregator",
      title: n.title,
      url: n.url,
      symbol_tags: (n.currencies ?? []).map((c: any) => c.code ?? c.symbol),
      sentiment_score: score(n.title)
    }));

    if (rows.length) await supabase.from("news_items").upsert(rows, { onConflict: "url" });
    return new Response(JSON.stringify({ ok: true, count: rows.length }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("fetch_news_sentiment error", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500 });
  }
});
