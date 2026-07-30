export type UnitCategory = 'volume' | 'mass' | 'count'

export interface ParsedUnit {
  category: UnitCategory
  /** Quantity in base units: ml, g, or count */
  amount: number
  /** Human-readable package size, e.g. "4 L" */
  display: string
}

const LIQUID_WORDS =
  /\b(milk|juice|water|soda|broth|cream|drink|beverage|cola|beer|wine|kefir|tea|coffee|oil|vinegar|soup|shake|smoothie)\b/i

const VOLUME_PATTERNS: {
  regex: RegExp
  toMl: (n: number) => number
  display: (n: number) => string
  liquidsOnly?: boolean
}[] = [
  {
    regex: /(\d+(?:\.\d+)?)\s*fl\.?\s*oz\.?/i,
    toMl: (n) => n * 29.5735,
    display: (n) => `${n} fl oz`,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*[-]?\s*oz\.?\b/i,
    toMl: (n) => n * 29.5735,
    display: (n) => `${n} fl oz`,
    liquidsOnly: true,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:ml|mL)\b/i,
    toMl: (n) => n,
    display: (n) => `${n} ml`,
  },
  {
    regex: /(?:,\s*|\s)(\d+(?:\.\d+)?)\s*L\b/i,
    toMl: (n) => n * 1000,
    display: (n) => `${n} L`,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:gal|gallon)s?\b/i,
    toMl: (n) => n * 3785.41,
    display: (n) => `${n} gal`,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:qt|quart)s?\b/i,
    toMl: (n) => n * 946.353,
    display: (n) => `${n} qt`,
  },
]

const MASS_PATTERNS: { regex: RegExp; toG: (n: number) => number; display: (n: number) => string }[] = [
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:kg|kilogram)s?\b/i,
    toG: (n) => n * 1000,
    display: (n) => `${n} kg`,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound)s?\b/i,
    toG: (n) => n * 453.592,
    display: (n) => `${n} lb`,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*[-]?\s*(?:oz|ounce)s?\.?\b/i,
    toG: (n) => n * 28.3495,
    display: (n) => `${n} oz`,
  },
  {
    regex: /(\d+(?:\.\d+)?)\s*(?:g|gram)s?\b/i,
    toG: (n) => n,
    display: (n) => `${n} g`,
  },
]

const COUNT_PATTERNS: { regex: RegExp; display: (n: number) => string }[] = [
  { regex: /(\d+)\s*[-]?\s*(?:ct|count|pk|pack|ea)\.?\b/i, display: (n) => `${n} ct` },
  { regex: /(\d+)\s*[-]?\s*(?:eggs|rolls|bars|cans)\b/i, display: (n) => `${n} ct` },
]

const MULTIPACK = /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(ml|mL|L|l|g|kg|oz|lb|lbs|fl\.?\s*oz\.?)/i

function parseVolume(name: string): ParsedUnit | null {
  const multipack = name.match(MULTIPACK)
  if (multipack) {
    const count = parseFloat(multipack[1])
    const size = parseFloat(multipack[2])
    const unit = multipack[3].toLowerCase().replace(/\s/g, '')
    if (unit === 'l') {
      const amount = count * size * 1000
      return { category: 'volume', amount, display: `${count} x ${size} L` }
    }
    if (unit === 'ml') {
      return { category: 'volume', amount: count * size, display: `${count} x ${size} ml` }
    }
    if (unit.includes('floz') || unit.includes('oz')) {
      const amount = count * size * 29.5735
      return { category: 'volume', amount, display: `${count} x ${size} fl oz` }
    }
  }

  for (const { regex, toMl, display, liquidsOnly } of VOLUME_PATTERNS) {
    if (liquidsOnly && !LIQUID_WORDS.test(name)) continue
    const match = name.match(regex)
    if (match) {
      const n = parseFloat(match[1])
      if (n > 0) {
        return { category: 'volume', amount: toMl(n), display: display(n) }
      }
    }
  }
  return null
}

function parseMass(name: string): ParsedUnit | null {
  for (const { regex, toG, display } of MASS_PATTERNS) {
    const match = name.match(regex)
    if (match) {
      const n = parseFloat(match[1])
      if (n > 0) {
        return { category: 'mass', amount: toG(n), display: display(n) }
      }
    }
  }
  return null
}

function parseCount(name: string): ParsedUnit | null {
  for (const { regex, display } of COUNT_PATTERNS) {
    const match = name.match(regex)
    if (match) {
      const n = parseFloat(match[1])
      if (n > 0) {
        return { category: 'count', amount: n, display: display(n) }
      }
    }
  }
  return null
}

export function parseUnit(name: string): ParsedUnit | null {
  return parseVolume(name) ?? parseMass(name) ?? parseCount(name)
}

export function unitPrice(price: number, parsed: ParsedUnit): number {
  return price / parsed.amount
}

export function formatUnitRate(
  rate: number,
  parsed: ParsedUnit,
  locale: string,
): string {
  const currency = locale === 'en-ca' ? 'CAD' : 'USD'
  const region = locale === 'en-ca' ? 'en-CA' : 'en-US'
  const fmt = (n: number) =>
    new Intl.NumberFormat(region, { style: 'currency', currency }).format(n)

  switch (parsed.category) {
    case 'volume':
      return `${fmt(rate * 1000)}/L`
    case 'mass':
      return `${fmt(rate * 1000)}/kg`
    case 'count':
      return `${fmt(rate)}/ea`
  }
}

export function pickBestValueItem<T extends { name: string; current_price: number | null }>(
  items: T[],
): { item: T; parsed: ParsedUnit | null; rate: number | null } | null {
  if (items.length === 0) return null

  const scored = items
    .filter((i) => i.current_price != null && i.current_price > 0)
    .map((item) => {
      const parsed = parseUnit(item.name)
      const rate = parsed ? unitPrice(item.current_price!, parsed) : null
      return { item, parsed, rate }
    })

  const withUnits = scored.filter((s) => s.rate != null)
  if (withUnits.length > 0) {
    const categories = new Map<UnitCategory, typeof withUnits>()
    for (const s of withUnits) {
      const cat = s.parsed!.category
      if (!categories.has(cat)) categories.set(cat, [])
      categories.get(cat)!.push(s)
    }
    const dominant = [...categories.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    )[0][1]
    return dominant.reduce((best, s) => (s.rate! < best.rate! ? s : best))
  }

  const fallback = scored.reduce((best, s) =>
    s.item.current_price! < best.item.current_price! ? s : best,
  )
  return { item: fallback.item, parsed: null, rate: null }
}

export function bestValueAtMerchant<T extends { name: string; current_price: number | null }>(
  items: T[],
): { item: T; parsed: ParsedUnit | null; rate: number | null } | null {
  return pickBestValueItem(items)
}
