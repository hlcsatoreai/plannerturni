# Crypto War Machine ULTRA (Lovable + Supabase)

Web app full-stack con dashboard semplice Next.js e backend Supabase per selezione probabilistica delle migliori opportunità crypto. Nessuna promessa di guadagni: output basato su probabilità + rischio.

## Stack obbligatorio implementato
- **Next.js UI** con 5 tab: Top Picks, Market Risk, Backtest, Diario, Smart Portfolio Allocator.
- **Supabase PostgreSQL** con tabelle: `symbols`, `market_snapshots`, `fundamentals`, `news_items`, `signals`, `trades_diary`.
- **Supabase Auth**: RLS su `trades_diary` per utente loggato.
- **Supabase Edge Functions**:
  - `fetch_binance_data`
  - `fetch_fundamentals`
  - `fetch_news_sentiment`
  - `compute_signals`
- **Cron/Scheduler** con `pg_cron` per refresh periodico.

## Endpoint Binance usati (reali)
- `GET /api/v3/exchangeInfo` -> universo simboli attivi
- `GET /api/v3/ticker/24hr` -> prezzi e volumi 24h
- `GET /api/v3/depth?symbol=XXX&limit=20` -> spread/depth score
- Estendibile con: `GET /api/v3/klines?interval=15m|1h|4h|1d`

### Conversione EUR
- Se coppia EUR esiste: uso prezzo diretto (es. `BTCEUR`)
- Altrimenti: `price_eur = price_usdt / EURUSDT` (entrambi da Binance)

## Modulo Smart Portfolio Allocator
- Seleziona top 5-6 coin da `Top Picks`
- Input utente: capitale e profilo Aggressivo/Bilanciato/Difensivo
- Pesi dinamici su score + confidenza + volatilità + supply risk
- Simulazione virtual portfolio: valore attuale, PnL €, PnL %, breakdown per coin
- Auto-rebalance periodico e stop globale in cash se market risk alto
- Storico 30/60 giorni previsto via `market_snapshots` + `signals`

## Setup locale
```bash
npm install
npm run dev
```

## Deploy / Supabase
1. Crea progetto Supabase
2. Applica migration SQL:
   ```bash
   supabase db push
   ```
3. Imposta secrets:
   ```bash
   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CRYPTOPANIC_API_KEY=...
   ```
4. Deploy funzioni:
   ```bash
   supabase functions deploy fetch_binance_data
   supabase functions deploy fetch_fundamentals
   supabase functions deploy fetch_news_sentiment
   supabase functions deploy compute_signals
   ```
5. Aggiorna `<PROJECT_REF>` nella migration scheduler.

## Anti-rate-limit & error handling
- Ogni funzione usa `try/catch` con logging server-side.
- Le fonti secondarie sono in fallback (CoinGecko/news aggregator) e marcano `dato mancante => penalità`.
- Consigliato usare batching + cache edge + retry esponenziale su 429.

## Note importanti
- Il motore supporta modalità BREVE/LUNGO e kill switch in base a market risk.
- Le decisioni mostrano sempre invalidazione (stop), R:R e confidence 0–5.
- L'app è orientata a utenti principianti: testo semplice e rischio esplicitato.
