import { searchDeals } from '../api/flipp'
import {
  bestValueAtMerchant,
  formatUnitRate,
  parseUnit,
  pickBestValueItem,
  unitPrice,
} from '../lib/parseUnit'
import type {
  BestStoreRecommendation,
  CompareResult,
  DealOption,
  FlippItem,
  ListItemResult,
  StoreSummary,
} from '../types'

const MAX_OPTIONS = 20

function toOption(item: FlippItem, locale: string): DealOption {
  const parsed = parseUnit(item.name)
  const rate = parsed ? unitPrice(item.current_price!, parsed) : null
  const option: DealOption = {
    id: `${item.flyer_item_id}-${item.merchant_id}`,
    name: item.name,
    price: item.current_price!,
    originalPrice: item.original_price,
    merchant: item.merchant_name,
    validTo: item.valid_to,
    saleStory: item.sale_story,
    unitRateValue: rate,
  }
  if (parsed && rate != null) {
    option.packageSize = parsed.display
    option.unitRate = formatUnitRate(rate, parsed, locale)
  }
  return option
}

function buildOptions(items: FlippItem[], locale: string): DealOption[] {
  const seen = new Set<string>()
  const options: DealOption[] = []

  for (const item of items) {
    const key = `${item.merchant_name}|${item.name}|${item.current_price}`
    if (seen.has(key)) continue
    seen.add(key)
    options.push(toOption(item, locale))
  }

  options.sort((a, b) => {
    if (a.unitRateValue != null && b.unitRateValue != null) {
      return a.unitRateValue - b.unitRateValue
    }
    if (a.unitRateValue != null) return -1
    if (b.unitRateValue != null) return 1
    return a.price - b.price
  })

  return options.slice(0, MAX_OPTIONS)
}

function merchantBestItems(items: FlippItem[]): Map<string, FlippItem> {
  const byMerchant = new Map<string, FlippItem[]>()
  for (const item of items) {
    if (!byMerchant.has(item.merchant_name)) {
      byMerchant.set(item.merchant_name, [])
    }
    byMerchant.get(item.merchant_name)!.push(item)
  }

  const result = new Map<string, FlippItem>()
  for (const [merchant, merchantItems] of byMerchant) {
    const best = bestValueAtMerchant(merchantItems)
    if (best) result.set(merchant, best.item)
  }
  return result
}

function buildStoreSummaries(
  listItems: string[],
  perItemMerchants: Map<string, Map<string, FlippItem>>,
  locale: string,
): StoreSummary[] {
  const storeMap = new Map<string, StoreSummary['breakdown']>()

  for (const [query, merchants] of perItemMerchants) {
    for (const [merchant, item] of merchants) {
      if (!storeMap.has(merchant)) storeMap.set(merchant, [])
      const parsed = parseUnit(item.name)
      const entry: StoreSummary['breakdown'][0] = {
        query,
        price: item.current_price!,
        name: item.name,
      }
      if (parsed) {
        entry.packageSize = parsed.display
        entry.unitRate = formatUnitRate(
          unitPrice(item.current_price!, parsed),
          parsed,
          locale,
        )
      }
      storeMap.get(merchant)!.push(entry)
    }
  }

  const summaries: StoreSummary[] = []
  for (const [merchant, breakdown] of storeMap) {
    summaries.push({
      merchant,
      total: breakdown.reduce((sum, b) => sum + b.price, 0),
      itemsFound: breakdown.length,
      itemsTotal: listItems.length,
      breakdown,
    })
  }

  return summaries.sort((a, b) => {
    if (b.itemsFound !== a.itemsFound) return b.itemsFound - a.itemsFound
    return a.total - b.total
  })
}

export function pickBestStore(
  stores: StoreSummary[],
  listItems: string[],
): BestStoreRecommendation | null {
  if (stores.length === 0) return null

  const sorted = [...stores].sort((a, b) => {
    const aFull = a.itemsFound === a.itemsTotal ? 1 : 0
    const bFull = b.itemsFound === b.itemsTotal ? 1 : 0
    if (bFull !== aFull) return bFull - aFull
    if (b.itemsFound !== a.itemsFound) return b.itemsFound - a.itemsFound
    return a.total - b.total
  })

  const best = sorted[0]
  const foundQueries = new Set(best.breakdown.map((b) => b.query))
  const missingItems = listItems.filter((q) => !foundQueries.has(q))

  return {
    ...best,
    hasFullCoverage: best.itemsFound === best.itemsTotal,
    missingItems,
  }
}

export async function compareShoppingList(
  postalCode: string,
  items: string[],
  locale: string,
  onProgress?: (done: number, total: number) => void,
): Promise<CompareResult> {
  const listResults: ListItemResult[] = []
  const perItemMerchants = new Map<string, Map<string, FlippItem>>()

  for (let i = 0; i < items.length; i++) {
    const query = items[i]
    const results = await searchDeals(postalCode, query, locale)
    const options = buildOptions(results, locale)
    const best = pickBestValueItem(results)

    if (options.length > 0 && best) {
      const defaultId = toOption(best.item, locale).id
      const hasDefault = options.some((o) => o.id === defaultId)

      listResults.push({
        query,
        found: true,
        options,
        defaultOptionId: hasDefault ? defaultId : options[0].id,
      })
      perItemMerchants.set(query, merchantBestItems(results))
    } else {
      listResults.push({ query, found: false, options: [] })
      perItemMerchants.set(query, new Map())
    }

    onProgress?.(i + 1, items.length)
  }

  const stores = buildStoreSummaries(items, perItemMerchants, locale)
  const bestStore = pickBestStore(stores, items)
  return { items: listResults, stores, bestStore }
}
