export interface FlippItem {
  flyer_item_id: number
  name: string
  current_price: number | null
  original_price: number | null
  merchant_name: string
  merchant_id: number
  valid_from: string
  valid_to: string
  sale_story: string | null
  clean_image_url?: string
}

export interface DealOption {
  id: string
  name: string
  price: number
  originalPrice: number | null
  merchant: string
  validTo: string
  saleStory: string | null
  packageSize?: string
  unitRate?: string
  /** Lower is better; null means no unit parse */
  unitRateValue: number | null
}

export interface ListItemResult {
  query: string
  found: boolean
  options: DealOption[]
  /** Pre-selected best-value option id */
  defaultOptionId?: string
}

export interface StoreSummary {
  merchant: string
  total: number
  itemsFound: number
  itemsTotal: number
  breakdown: {
    query: string
    price: number
    name: string
    packageSize?: string
    unitRate?: string
  }[]
}

export interface BestStoreRecommendation extends StoreSummary {
  hasFullCoverage: boolean
  missingItems: string[]
}

export interface CompareResult {
  items: ListItemResult[]
  stores: StoreSummary[]
  bestStore: BestStoreRecommendation | null
}
