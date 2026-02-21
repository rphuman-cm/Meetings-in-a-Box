# Matchup Delta Engine

A browser-based, app-ready matchup engine that compares Team A vs Team B season profile metrics and outputs:

- Projected margin adjustment (and final projected margin)
- Projected total adjustment (and final projected total)
- Win probability confidence and chaos/volatility rating
- Recommended bet type leaning (spread vs total vs derivatives)
- Parlay correlation tag (Fav+Over / Fav+Under / Avoid assumptions)
- Human-readable mismatch flags

## Quick start

```bash
npm start
```

Then open `http://localhost:4173` (or your environment `PORT`).

## Model notes

The engine follows a six-delta structure in points per 100 possessions:

1. Turnover Pressure Delta
2. Rebounding Clash Delta
3. 3P Volume vs Allowed Delta
4. 3P Efficiency Clash Delta
5. 2P/Rim Efficiency Clash Delta
6. Free Throw Rate Delta

Those deltas roll into a single matchup delta, then scale by expected possessions to produce scoreboard-level adjustments.

Constants and league means/std values are exposed in the UI so you can tune with backtesting.
