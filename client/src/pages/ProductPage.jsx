import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { API_URL, CATEGORY_LABELS, formatPrice, imageUrl } from '../lib/shop'

const emptyForm = { name: '', phone: '', address: '', note: '' }

const ProductPage = () => {
    const { id } = useParams()   // the :id from the address /products/:id

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [quantity, setQuantity] = useState(1)
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [placed, setPlaced] = useState(null)   // holds the order summary after a successful order

    // load this product whenever the id in the address changes
    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const res = await fetch(`${API_URL}/products/${id}`)
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(data.message || 'Could not load this product.')
                if (!cancelled) setProduct(data.product)
            } catch (err) {
                console.error('Could not load product:', err)
                if (!cancelled) setError(err.message || 'Could not load this product.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [id])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const changeQuantity = (delta) => {
        setQuantity((q) => Math.min(20, Math.max(1, q + delta)))
    }

    const handleOrder = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,   // only the id and quantity: the server looks up the real price
                    quantity,
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                    note: form.note.trim(),
                }),
            })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                toast.error(data.message || 'Could not place your order.')
                return
            }

            toast.success(data.message || 'Order placed successfully')
            setPlaced(data.order)
            setForm(emptyForm)
            setQuantity(1)
        } catch (err) {
            console.error('Order failed:', err)
            toast.error('Cannot reach the server. Check your connection and try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <p className="py-20 text-center text-gray-500">Loading product…</p>
    }

    if (error || !product) {
        return (
            <div className="mx-auto max-w-screen-md px-4 py-20 text-center">
                <p className="mb-4 text-red-700">{error || 'Product not found.'}</p>
                <Link to="/" className="text-blue-700 hover:underline">← Back to the shop</Link>
            </div>
        )
    }

    const total = product.price * quantity
    const inputClass =
        'w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300'

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6">
            <Link to="/" className="text-sm text-blue-700 hover:underline">← Back to the shop</Link>

            <div className="mt-4 grid gap-8 md:grid-cols-2">
                {/* left: the picture */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    <img
                        src={imageUrl(product.image)}
                        alt={product.name}
                        className="h-full max-h-[520px] w-full object-cover"
                    />
                </div>

                {/* right: the details and the order form */}
                <div>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                        {CATEGORY_LABELS[product.category] || product.category}
                    </span>
                    <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
                    <p className="mt-2 text-2xl font-bold">{formatPrice(product.price)}</p>

                    <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Description</h2>
                    <p className="mt-1 whitespace-pre-line text-gray-700">{product.description}</p>

                    <div className="mt-8 rounded-lg border border-gray-200 p-4">
                        {placed ? (
                            // shown instead of the form once the order has gone through
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-green-700">Order received</h2>
                                <p className="mt-2 text-sm text-gray-700">
                                    {placed.quantity} × {placed.productName}
                                </p>
                                <p className="font-semibold">Total: {formatPrice(placed.total)}</p>
                                <p className="mt-2 text-xs text-gray-500">Order reference: {placed.id}</p>
                                <p className="mt-3 text-sm text-gray-600">We will contact you on your phone to confirm.</p>
                                <div className="mt-4 flex justify-center gap-4 text-sm">
                                    <button
                                        type="button"
                                        onClick={() => setPlaced(null)}
                                        className="text-blue-700 hover:underline"
                                    >
                                        Order again
                                    </button>
                                    <Link to="/" className="text-blue-700 hover:underline">Continue shopping</Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleOrder} className="space-y-3">
                                <h2 className="text-lg font-bold">Order this product</h2>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Quantity</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => changeQuantity(-1)}
                                            disabled={quantity <= 1}
                                            className="h-8 w-8 rounded border border-gray-300 text-lg disabled:opacity-40"
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center font-semibold">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => changeQuantity(1)}
                                            disabled={quantity >= 20}
                                            className="h-8 w-8 rounded border border-gray-300 text-lg disabled:opacity-40"
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="o-name" className="mb-1 block text-sm font-medium">Your name</label>
                                    <input
                                        id="o-name" name="name" type="text" value={form.name}
                                        onChange={handleChange} required autoComplete="name"
                                        placeholder="eg. John Doe" className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="o-phone" className="mb-1 block text-sm font-medium">Phone number</label>
                                    <input
                                        id="o-phone" name="phone" type="tel" value={form.phone}
                                        onChange={handleChange} required autoComplete="tel"
                                        placeholder="eg. +254712345678" className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="o-address" className="mb-1 block text-sm font-medium">Delivery address</label>
                                    <textarea
                                        id="o-address" name="address" rows={2} value={form.address}
                                        onChange={handleChange} required autoComplete="street-address"
                                        placeholder="Town, street, and any landmark" className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="o-note" className="mb-1 block text-sm font-medium">
                                        Note <span className="font-normal text-gray-500">(optional)</span>
                                    </label>
                                    <input
                                        id="o-note" name="note" type="text" value={form.note}
                                        onChange={handleChange} maxLength={500}
                                        placeholder="eg. size 42, black" className={inputClass}
                                    />
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                                    <span className="font-medium">Total</span>
                                    <span className="text-xl font-bold">{formatPrice(total)}</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded bg-gray-900 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? 'Placing your order…' : 'Place order'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductPage