// btc-race-24h-20261118-1444 entry: a slow-momentum trend bot for CBBTC/USDC.
//
// Idea, in my own design: Bitcoin on this pool trends in multi-hour waves
// (the dev window swings 1-2% per hour) but whipsaws minute to minute, and a
// full-size round trip costs ~26 bps in fees, slippage and impact. So the bot
// only buys when three horizons agree the trend is up, and it exits on a
// stop, a trailing stop, a momentum reversal, or a time cap -- whichever
// comes first. It never shorts, never uses leverage, and trades at most
// once per reply. All decisions use only the closes of the bars the hello
// and batch messages carry; everything is integer maths, so two runs on the
// same data produce identical orders.
//
// Entry (flat only): 60-minute return >= +35 bps AND 15-minute return >= 0
// (short-term confirmation, filters whipsaw spikes) AND 120-minute return
// >= 0 (longer trend not down). At least 30 bars since the last exit, and
// no new entries in the last 60 bars of the window.
// Revised after the first official grade (+$10.28 at a +40 bps entry):
// the backtest shows +30/+35/+40 bps all trigger on the same dev bars, so
// +35 bps keeps the dev result while entering slightly earlier on a live
// window where the 60-minute return climbs more slowly.
// Exit (holding): stop-loss -150 bps vs entry close, trailing stop -120 bps
// from the highest close since entry, 60-minute return <= -80 bps
// (momentum has turned), or 360 bars held (about 6 hours -- a wave is over).

import { runBars } from "./vendor/makefun-bars.ts";
import type { BarsState, Batch, OrderInput } from "./vendor/makefun-bars.ts";

const SYMBOL = "CBBTC";

// Entry thresholds, in basis points of close-to-close return.
const BUY_RET60_BPS = 35n;
const EXIT_RET60_BPS = -80n;
const STOP_BPS = -150n;
const TRAIL_BPS = -120n;
const MAX_HOLD_BARS = 360;
const COOLDOWN_BARS = 30;
const NO_ENTRY_AFTER_SEQ = 1380;
const MAX_SLIPPAGE_BPS = 300;

// All closes seen so far, as raw price integers (price_scale 5).
const closes: bigint[] = [];
let entryClose: bigint | null = null;
let peakClose: bigint | null = null;
let heldBars = 0;
let lastExitSeq = -100000;

// Return in bps between the close `back` bars ago and the latest close.
// Uses integer maths on the raw price integers; truncates toward zero.
function retBps(back: number): bigint | null {
  if (closes.length <= back) return null;
  const now = closes[closes.length - 1]!;
  const old = closes[closes.length - 1 - back]!;
  if (old <= 0n) return null;
  return ((now - old) * 10000n) / old;
}

function onBatch(state: BarsState, batch: Batch): OrderInput[] {
  if (state.warmingUp) return [];
  const bar = batch.bars.find((b) => b.symbol === SYMBOL);
  if (bar === undefined) return [];
  closes.push(BigInt(bar.c));
  const close = closes[closes.length - 1]!;
  const pos = state.positions.get(SYMBOL);
  const qty = pos === undefined ? 0n : pos.qty;

  if (qty > 0n) {
    // Holding: sync entry tracking, then check the exits.
    if (entryClose === null) {
      entryClose = close;
      peakClose = close;
      heldBars = 0;
    }
    heldBars += 1;
    if (peakClose !== null && close > peakClose) peakClose = close;
    const entry = entryClose!;
    const peak = peakClose!;
    const pnlBps = ((close - entry) * 10000n) / entry;
    const trailBps = ((close - peak) * 10000n) / peak;
    const ret60 = retBps(60);
    const stopHit = pnlBps <= STOP_BPS;
    const trailHit = trailBps <= TRAIL_BPS;
    const timeHit = heldBars >= MAX_HOLD_BARS;
    const momHit = ret60 !== null && ret60 <= EXIT_RET60_BPS;
    if (stopHit || trailHit || timeHit || momHit) {
      lastExitSeq = state.seq;
      entryClose = null;
      peakClose = null;
      heldBars = 0;
      return [{ side: "sell", symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  }

  // Flat: clear any stale entry tracking and look for a buy.
  entryClose = null;
  peakClose = null;
  heldBars = 0;
  if (state.seq > NO_ENTRY_AFTER_SEQ) return [];
  if (state.seq - lastExitSeq < COOLDOWN_BARS) return [];
  if (state.cash <= 0n) return [];
  const ret60 = retBps(60);
  const ret15 = retBps(15);
  const ret120 = retBps(120);
  if (ret60 === null || ret15 === null || ret120 === null) return [];
  if (ret60 < BUY_RET60_BPS) return [];
  if (ret15 < 0n) return [];
  if (ret120 < 0n) return [];
  return [{ side: "buy", symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
}

await runBars({ onBatch });
