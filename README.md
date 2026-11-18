# btc-race-bot-4

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/TUHIN729/btc-race-bot-4/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/TUHIN729/btc-race-bot-4/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

Build a bot that trades Coinbase Wrapped BTC (cbBTC) on 1-minute on-chain prices with $1,000 of paper money, so nothing is traded for real, for the highest net PnL on the 24 hours that start 15 minutes after the deadline.

This entry is a slow-momentum trend bot for cbBTC/USDC on 1-minute Orca Whirlpool bars. It buys on confirmed 60-minute momentum (+35 bps with 15-minute and 120-minute confirmation), exits on a stop-loss, trailing stop, momentum reversal, or a 6-hour hold cap. Long only, full-size entries, fully deterministic — no clock, no network, no files outside the repository.

Dev window (24 hours, 1,440 bars, frozen before the opening): **net PnL +$10.28 after all fees, 4 trades (2 round trips), max drawdown 1.10%** — passes the dev gate (net PnL above $0) and the race guardrails (≥1 trade, drawdown ≤25%).

## Run it

```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ecdsgx0z&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
