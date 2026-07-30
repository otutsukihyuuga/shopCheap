import type { FlippItem } from '../types'

const BASE = 'https://backflipp.wishabi.com/flipp'

export function detectLocale(postalCode: string): string {
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase()
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) return 'en-ca'
  return 'en-us'
}

export function normalizePostalCode(postalCode: string): string {
  return postalCode.replace(/\s/g, '').toUpperCase()
}

export async function searchDeals(
  postalCode: string,
  query: string,
  locale: string,
): Promise<FlippItem[]> {
  const params = new URLSearchParams({
    postal_code: normalizePostalCode(postalCode),
    q: query,
    locale,
  })

  const res = await fetch(`${BASE}/items/search?${params}`)
  if (!res.ok) {
    throw new Error(`Search failed for "${query}" (${res.status})`)
  }

  const data = await res.json()
  return (data.items ?? []).filter(
    (item: FlippItem) => item.current_price != null && item.current_price > 0,
  )
}
