import { useState } from 'react'
import { parseListItems } from '../lib/parseList'

interface Props {
  postalCode: string
  onPostalCodeChange: (value: string) => void
  items: string[]
  onAddItem: (item: string) => void
  onAddItems: (items: string[]) => void
  onRemoveItem: (index: number) => void
  onCompare: () => void
  loading: boolean
  canCompare: boolean
}

export function ShoppingListForm({
  postalCode,
  onPostalCodeChange,
  items,
  onAddItem,
  onAddItems,
  onRemoveItem,
  onCompare,
  loading,
  canCompare,
}: Props) {
  const [bulkText, setBulkText] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('item') as HTMLInputElement
    const value = input.value.trim()
    if (value) {
      onAddItem(value)
      input.value = ''
    }
  }

  const handleBulkAdd = () => {
    const parsed = parseListItems(bulkText)
    if (parsed.length > 0) {
      onAddItems(parsed)
      setBulkText('')
    }
  }

  return (
    <section className="panel">
      <div className="field">
        <label htmlFor="postal">Postal / ZIP code</label>
        <input
          id="postal"
          type="text"
          placeholder="e.g. M5V2H1 or 90210"
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
          disabled={loading}
        />
      </div>

      <form className="add-form" onSubmit={handleSubmit}>
        <div className="field grow">
          <label htmlFor="item">Add item</label>
          <input
            id="item"
            type="text"
            placeholder="e.g. milk"
            disabled={loading}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn secondary" disabled={loading}>
          Add
        </button>
      </form>

      <div className="bulk-section">
        <div className="field">
          <label htmlFor="bulk">Bulk paste</label>
          <textarea
            id="bulk"
            rows={3}
            placeholder="Paste items — one per line or comma-separated"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          type="button"
          className="btn secondary"
          onClick={handleBulkAdd}
          disabled={loading || !bulkText.trim()}
        >
          Add all
        </button>
      </div>

      {items.length > 0 && (
        <ul className="item-list">
          {items.map((item, i) => (
            <li key={`${item}-${i}`}>
              <span>{item}</span>
              <button
                type="button"
                className="btn icon"
                onClick={() => onRemoveItem(i)}
                disabled={loading}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn primary full"
        onClick={onCompare}
        disabled={!canCompare || loading}
      >
        {loading ? 'Searching flyers…' : 'Find cheapest deals'}
      </button>
    </section>
  )
}
