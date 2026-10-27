import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL, formatPrice, imageUrl } from '../lib/shop'

// the choices in the "Sort by" dropdown. null means "keep the order the server sent" (newest first)
const SORTS = {
    newest: { label: 'Newest first', compare: null },
    low: { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
    high: { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
}

const CategoryPage = ({ category, title }) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [detail, setDetail] = useState('')   // technical reason, shown only while developing
    const [sort, setSort] = useState('newest')

    // runs when the page opens, and again if the category changes
    useEffect(() => {
        let cancelled = false   // avoids updating state if the page was closed before the reply came back
        const url = `${API_URL}/products?category=${encodeURIComponent(category)}&limit=60`

        const fail = (reason) => {
            if (cancelled) return
            setError('We could not load the products right now. Please try again later.')
            setDetail(reason)
        }

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const res = await fetch(url)
                const data = await res.json().catch(() => ({}))

                if (!res.ok) {
                    console.error(`Products request failed with status ${res.status}:`, data)
                    fail(`${url} answered ${res.status}${data.message ? ' — ' + data.message : ''}`)
                    return
                }

                if (!cancelled) setProducts(data.products || [])
            } catch (err) {
                // fetch itself failed: server stopped, wrong port, or the browser blocked it (CORS)
                console.error('Could not reach the server:', err)
                fail(`Could not reach ${url}. Is the server running, and does the port match?`)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [category])

    // sorts a copy of the list, so the original order is never changed
    const shown = useMemo(() => {
        const compare = SORTS[sort].compare
        return compare ? [...products].sort(compare) : products
    }, [products, sort])

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    {!loading && !error && (
                        <p className="mt-1 text-sm text-gray-500">
                            {shown.length} {shown.length === 1 ? 'product' : 'products'}
                        </p>
                    )}
                </div>

                {!loading && !error && shown.length > 1 && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="cat-sort" className="text-sm text-gray-600">Sort by</label>
                        <select
                            id="cat-sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        >
                            {Object.entries(SORTS).map(([key, s]) => (
                                <option key={key} value={key}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading && <p className="py-16 text-center text-gray-500">Loading products…</p>}

            {error && (
                <div className="rounded bg-red-50 p-3 text-center text-red-700">
                    <p>{error}</p>
                    {import.meta.env.DEV && detail && (
                        <p className="mt-1 break-all text-xs text-red-500">{detail}</p>
                    )}
                </div>
            )}

            {!loading && !error && shown.length === 0 && (
                <div className="py-16 text-center text-gray-500">
                    <p>No {category} products yet.</p>
                    <Link to="/" className="mt-2 inline-block text-blue-700 hover:underline">← Back to the shop</Link>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {shown.map((p) => (
                    <Link
                        key={p._id}
                        to={`/products/${p._id}`}
                        className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
                    >
                        <div className="aspect-square overflow-hidden bg-gray-100">
                            <img
                                src={imageUrl(p.image)}
                                alt={p.name}
                                loading="lazy"
                                onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                        </div>
                        <div className="p-3">
                            <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                            <p className="mt-1 font-bold">{formatPrice(p.price)}</p>
                            <span className="mt-2 inline-block text-sm text-blue-700 group-hover:underline">
                                View and order →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default CategoryPage