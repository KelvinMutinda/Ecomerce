import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL, CATEGORY_LABELS, formatPrice, imageUrl } from '../lib/shop'

const LatestProducts = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // runs once when the Home page opens: asks the backend for the products
    useEffect(() => {
        let cancelled = false   // avoids updating state if the page was closed before the reply came back

        const load = async () => {
            try {
                const res = await fetch(`${API_URL}/products`)
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(data.message || 'Could not load products.')
                if (!cancelled) setProducts(data.products || [])
            } catch (err) {
                console.error('Could not load products:', err)
                if (!cancelled) setError('We could not load the products right now. Please try again later.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    return (
        <section className="my-8 px-2 sm:px-0">
            <div className="mb-4 flex items-end justify-between">
                <h2 className="text-2xl font-bold">Latest products</h2>
                {!loading && !error && products.length > 0 && (
                    <span className="text-sm text-gray-500">{products.length} available</span>
                )}
            </div>

            {loading && <p className="py-8 text-center text-gray-500">Loading products…</p>}

            {error && <p className="rounded bg-red-50 p-3 text-center text-red-700">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <p className="py-8 text-center text-gray-500">No products yet. Check back soon.</p>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
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
                            <span className="text-xs uppercase tracking-wide text-gray-500">
                                {CATEGORY_LABELS[p.category] || p.category}
                            </span>
                            <h3 className="mt-1 truncate text-sm font-semibold">{p.name}</h3>
                            <p className="mt-1 font-bold">{formatPrice(p.price)}</p>
                            <span className="mt-2 inline-block text-sm text-blue-700 group-hover:underline">
                                View and order →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default LatestProducts