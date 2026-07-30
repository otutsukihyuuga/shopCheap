# shopCheap

Find the cheapest flyer deals near you. Enter a postal/ZIP code, build a shopping list, and shopCheap searches [Flipp](https://flipp.com) flyers to compare options by **unit price** (price per weight/volume), not just sticker price.

## Features

- Postal / ZIP code based local flyer search
- Single-item add or **bulk paste** (newlines / commas)
- Per-item **dropdown of deal options** — pick what you want
- Running **total updates** as you change selections
- Comparison by **unit value** (e.g. $/L, $/kg) when package size can be parsed
- Suggested one-stop store when one retailer covers most of the list
- List + postal code saved in `localStorage`

## Stack

- React + TypeScript
- Vite
- Flipp’s public search endpoints (unofficial — no API key)

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## How it works

1. Enter your postal or ZIP code (US or Canada).
2. Add items individually or paste a list.
3. Click **Find cheapest deals**.
4. Open each item’s dropdown, pick a deal, and watch **Your total** update.

## Notes

- Deal data comes from Flipp’s internal endpoints used by their website. These are **not an official public API** and may change.
- Matches are flyer search results — they may not be an exact product match.
- Items with no nearby flyer deal show as not found.

## License

Private / personal use. Not affiliated with Flipp.
