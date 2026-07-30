import { useCallback, useEffect, useState } from 'react'
import { detectLocale } from './api/flipp'
import { ShoppingListForm } from './components/ShoppingListForm'
import { ResultsView } from './components/ResultsView'
import { compareShoppingList } from './lib/compare'
import type { CompareResult } from './types'

const STORAGE_KEY = 'shopcheap'

function loadSaved(): { postalCode: string; items: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { postalCode: '', items: [] }
}

function App() {
  const saved = loadSaved()
  const [postalCode, setPostalCode] = useState(saved.postalCode)
  const [items, setItems] = useState<string[]>(saved.items)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ postalCode, items }))
  }, [postalCode, items])

  const addItem = useCallback((item: string) => {
    setItems((prev) => [...prev, item])
    setResult(null)
  }, [])

  const addItems = useCallback((newItems: string[]) => {
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.toLowerCase()))
      const unique = newItems.filter((i) => !existing.has(i.toLowerCase()))
      return [...prev, ...unique]
    })
    setResult(null)
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setResult(null)
  }, [])

  const compare = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress({ done: 0, total: items.length })

    try {
      const locale = detectLocale(postalCode)
      const data = await compareShoppingList(
        postalCode,
        items,
        locale,
        (done, total) => setProgress({ done, total }),
      )
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }, [postalCode, items])

  const canCompare = postalCode.trim().length >= 5 && items.length > 0

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>shopCheap</h1>
          <p>Compare flyer deals by unit price</p>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <ShoppingListForm
            postalCode={postalCode}
            onPostalCodeChange={setPostalCode}
            items={items}
            onAddItem={addItem}
            onAddItems={addItems}
            onRemoveItem={removeItem}
            onCompare={compare}
            loading={loading}
            canCompare={canCompare}
          />
        </aside>

        <section className="content">
          {loading && progress && (
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
              <span>
                Searching {progress.done}/{progress.total}…
              </span>
            </div>
          )}

          {error && <div className="error">{error}</div>}

          {result ? (
            <ResultsView result={result} locale={detectLocale(postalCode)} />
          ) : (
            !loading && (
              <div className="empty-state">
                <h2>No results yet</h2>
                <p>
                  Add your postal code and shopping list on the left, then find
                  deals. Results and your running total will show here.
                </p>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  )
}

export default App
