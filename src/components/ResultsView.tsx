import { useEffect, useMemo, useState } from 'react'
import type { CompareResult, DealOption } from '../types'

interface Props {
  result: CompareResult
  locale: string
}

function formatPrice(price: number, locale: string): string {
  const currency = locale === 'en-ca' ? 'CAD' : 'USD'
  const region = locale === 'en-ca' ? 'en-CA' : 'en-US'
  return new Intl.NumberFormat(region, {
    style: 'currency',
    currency,
  }).format(price)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function defaultSelections(result: CompareResult): Record<string, string> {
  const next: Record<string, string> = {}
  for (const item of result.items) {
    if (item.defaultOptionId) next[item.query] = item.defaultOptionId
  }
  return next
}

export function ResultsView({ result, locale }: Props) {
  const [selections, setSelections] = useState(() => defaultSelections(result))
  const [openQuery, setOpenQuery] = useState<string | null>(
    () => result.items.find((i) => i.found)?.query ?? null,
  )

  useEffect(() => {
    setSelections(defaultSelections(result))
    setOpenQuery(result.items.find((i) => i.found)?.query ?? null)
  }, [result])

  const selectedOptions = useMemo(() => {
    const map = new Map<string, DealOption>()
    for (const item of result.items) {
      const id = selections[item.query]
      const option = item.options.find((o) => o.id === id)
      if (option) map.set(item.query, option)
    }
    return map
  }, [result.items, selections])

  const total = useMemo(() => {
    let sum = 0
    for (const option of selectedOptions.values()) sum += option.price
    return sum
  }, [selectedOptions])

  const selectedCount = selectedOptions.size
  const foundCount = result.items.filter((i) => i.found).length

  const storeBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const option of selectedOptions.values()) {
      counts.set(option.merchant, (counts.get(option.merchant) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [selectedOptions])

  const selectOption = (query: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [query]: optionId }))
  }

  const toggleOpen = (query: string) => {
    setOpenQuery((prev) => (prev === query ? null : query))
  }

  return (
    <section className="results">
      <div className="total-bar">
        <div>
          <span className="total-label">Your total</span>
          <strong className="total-amount">{formatPrice(total, locale)}</strong>
          <p className="total-meta">
            {selectedCount} of {result.items.length} items selected
            {foundCount < result.items.length &&
              ` · ${result.items.length - foundCount} not found`}
          </p>
        </div>
        {storeBreakdown.length > 0 && (
          <div className="total-stores">
            {storeBreakdown.map(([merchant, count]) => (
              <span key={merchant}>
                {merchant} ({count})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="results-header">
        <h2>Pick options</h2>
        <p>Open each item and choose a deal — total updates as you go</p>
      </div>

      <div className="accordion-list">
        {result.items.map((item) => {
          const selected = selectedOptions.get(item.query)
          const isOpen = openQuery === item.query

          return (
            <div
              key={item.query}
              className={`accordion ${item.found ? '' : 'not-found'} ${isOpen ? 'open' : ''}`}
            >
              <button
                type="button"
                className="accordion-trigger"
                onClick={() => toggleOpen(item.query)}
                aria-expanded={isOpen}
              >
                <div className="accordion-summary">
                  <span className="accordion-query">{item.query}</span>
                  {item.found && selected ? (
                    <span className="accordion-pick">
                      {selected.merchant}
                      {selected.packageSize ? ` · ${selected.packageSize}` : ''}
                    </span>
                  ) : (
                    <span className="badge warn">Not found</span>
                  )}
                </div>
                <div className="accordion-right">
                  {selected && (
                    <span className="accordion-price">
                      {formatPrice(selected.price, locale)}
                    </span>
                  )}
                  {item.found && (
                    <span className="accordion-chevron" aria-hidden>
                      {isOpen ? '▾' : '▸'}
                    </span>
                  )}
                </div>
              </button>

              {isOpen && item.found && (
                <div className="accordion-panel" role="listbox">
                  <p className="options-hint">
                    {item.options.length} option
                    {item.options.length === 1 ? '' : 's'} · sorted by unit value
                  </p>
                  <ul className="option-list">
                    {item.options.map((option) => {
                      const isSelected = selections[item.query] === option.id
                      return (
                        <li key={option.id}>
                          <label
                            className={`option-row ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`option-${item.query}`}
                              checked={isSelected}
                              onChange={() => selectOption(item.query, option.id)}
                            />
                            <div className="option-body">
                              <div className="option-top">
                                <span className="option-merchant">
                                  {option.merchant}
                                </span>
                                <span className="option-price">
                                  {formatPrice(option.price, locale)}
                                </span>
                              </div>
                              <p className="option-name">{option.name}</p>
                              <div className="option-meta">
                                {option.packageSize && (
                                  <span>{option.packageSize}</span>
                                )}
                                {option.unitRate && (
                                  <span className="option-unit">
                                    {option.unitRate}
                                  </span>
                                )}
                                {option.saleStory && (
                                  <span className="option-sale">
                                    {option.saleStory}
                                  </span>
                                )}
                                <span>until {formatDate(option.validTo)}</span>
                              </div>
                            </div>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {isOpen && !item.found && (
                <div className="accordion-panel">
                  <p className="empty">No flyer deals found near your area.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {result.bestStore && (
        <details className="best-store-details">
          <summary>
            One-stop tip: {result.bestStore.merchant} (
            {result.bestStore.itemsFound}/{result.bestStore.itemsTotal} items ·{' '}
            {formatPrice(result.bestStore.total, locale)})
          </summary>
          <ul className="best-store-items">
            {result.bestStore.breakdown.map((row) => (
              <li key={row.query}>
                <span className="item-query">{row.query}</span>
                <span className="item-detail">
                  {row.name}
                  {row.packageSize && ` (${row.packageSize})`}
                  {' · '}
                  {formatPrice(row.price, locale)}
                  {row.unitRate && ` · ${row.unitRate}`}
                </span>
              </li>
            ))}
          </ul>
          {result.bestStore.missingItems.length > 0 && (
            <p className="best-store-missing">
              Missing: {result.bestStore.missingItems.join(', ')}
            </p>
          )}
        </details>
      )}
    </section>
  )
}
