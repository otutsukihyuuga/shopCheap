# shopCheap

**Hackathon focus:** budgeting for workers who earn *daily* — not another money-in / money-out ledger.

When pay lands every day (or not at all), the useful question isn’t “what did I spend last month?” It’s **“with what I made *today*, how do I buy what I need without blowing the rest of the day?”**

shopCheap turns today’s cash into a concrete grocery plan: enter earnings, list what you need, and compare nearby [Flipp](https://flipp.com) flyer deals by **unit price** so bulk value isn’t hidden behind a lower sticker price. Pick options item-by-item and watch **grocery spend** vs **cash left for the day** update live.

## Why this, not a classic budget app

| Typical budget app | shopCheap for daily earners |
|---|---|
| Track past transactions | Plan *tonight’s* shop against *today’s* pay |
| Categories & charts | Real flyer prices near you |
| Monthly envelopes | Live leftover cash as you swap deals |
| Assumes steady paycheck | Fits irregular, day-to-day income |

## Features

- **Today’s earnings** — set how much you have for food right now
- **Live leftover** — grocery total vs earnings; warns when you’re over
- Postal / ZIP–based local flyer search
- Bulk paste for a fast “need today” list
- Per-item **deal dropdowns** sorted by unit value ($/L, $/kg, etc.)
- Running spend updates as you change picks
- One-stop store tip when one retailer covers more of the list
- Earnings, list, and location saved in `localStorage`

## Stack

- React + TypeScript + Vite
- Flipp flyer search endpoints (unofficial — no API key)

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## How to use

1. Enter **today’s earnings**.
2. Enter your postal / ZIP code.
3. Add what you need (one-by-one or paste a list).
4. Hit **Stretch today’s cash**.
5. Open each item, pick a deal, and watch spend + leftover update.

## Notes

- Flyer data comes from Flipp’s website backends — not an official public API; it may change.
- Matches are search results and may not be an exact SKU match.
- Items with no nearby flyer deal show as not found.

## License

Private / personal use. Not affiliated with Flipp.
