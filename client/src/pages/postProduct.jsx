import React, { useEffect, useState } from 'react'

// Change this to your backend address. It reads VITE_API_URL if you set one.
const API_URL = (import.meta.env.VITE_API_URL || "https://ecomerce-m62g.onrender.com//api").replace(/\/+$/, "")

const CATEGORIES = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'kids', label: 'Kids' },
]

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024   // 5 MB, same limit as the server

const emptyForm = {
    name: '',
    description: '',
    price: '',
    category: '',
}

const PostProduct = () => {
    const [form, setForm] = useState(emptyForm)
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState('')
    const [fileKey, setFileKey] = useState(0)          // changing this clears the file input
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState({ type: '', text: '' })   // type: 'success' | 'error'

    // build a preview URL for the chosen file, and free it when the file changes
    useEffect(() => {
        if (!file) {
            setPreview('')
            return
        }
        const url = URL.createObjectURL(file)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((f) => ({ ...f, [name]: value }))
    }

    const handleFile = (e) => {
        const picked = e.target.files[0]
        if (!picked) {
            setFile(null)
            return
        }
        if (!ALLOWED_TYPES.includes(picked.type)) {
            setStatus({ type: 'error', text: 'The image must be a JPG, PNG or WebP file.' })
            e.target.value = ''
            setFile(null)
            return
        }
        if (picked.size > MAX_SIZE) {
            setStatus({ type: 'error', text: 'The image must be 5 MB or smaller.' })
            e.target.value = ''
            setFile(null)
            return
        }
        setStatus({ type: '', text: '' })
        setFile(picked)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus({ type: '', text: '' })

        const price = Number(form.price)
        if (!Number.isFinite(price) || price < 0) {
            setStatus({ type: 'error', text: 'Price must be a number of 0 or more.' })
            return
        }
        if (!file) {
            setStatus({ type: 'error', text: 'Please choose a product image.' })
            return
        }

        // files must be sent as FormData, not JSON
        const data = new FormData()
        data.append('name', form.name.trim())
        data.append('description', form.description.trim())
        data.append('price', String(price))
        data.append('category', form.category)
        data.append('image', file)

        setSubmitting(true)
        try {
            // no Content-Type header here: the browser adds the correct multipart one
            const res = await fetch(`${API_URL}/product`, { method: 'POST', body: data })
            const json = await res.json().catch(() => ({}))

            if (!res.ok) {
                setStatus({ type: 'error', text: json.message || 'Could not add the product.' })
                return
            }

            setStatus({ type: 'success', text: json.message || 'Product added successfully.' })
            setForm(emptyForm)
            setFile(null)
            setFileKey((k) => k + 1)
        } catch {
            setStatus({ type: 'error', text: 'Cannot reach the server. Check your connection and try again.' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="pp-page">
            <div className="pp-card">
                <form onSubmit={handleSubmit}>
                    <div className="pp-header">
                        <h2>Post a product</h2>
                        <p>Fill in the details below to add a product to the store.</p>
                    </div>

                    <div className="pp-group">
                        <label htmlFor="pp-name">Product name</label>
                        <input
                            id="pp-name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="eg. Running shoes"
                            required
                        />
                    </div>

                    <div className="pp-group">
                        <label htmlFor="pp-description">Description</label>
                        <textarea
                            id="pp-description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the product, its features and condition"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="pp-row">
                        <div className="pp-group">
                            <label htmlFor="pp-price">Price</label>
                            <input
                                id="pp-price"
                                type="number"
                                name="price"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="pp-group">
                            <label htmlFor="pp-category">Category</label>
                            <select
                                id="pp-category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>Select a category</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pp-group">
                        <label htmlFor="pp-image">Product image</label>
                        <input
                            key={fileKey}
                            id="pp-image"
                            type="file"
                            name="image"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFile}
                            required
                        />
                        <span className="pp-hint">
                            {file ? file.name : 'JPG, PNG or WebP, up to 5 MB.'}
                        </span>
                    </div>

                    {preview && (
                        <div className="pp-preview">
                            <img src={preview} alt="Product preview" />
                        </div>
                    )}

                    <button type="submit" className="pp-btn" disabled={submitting}>
                        {submitting ? 'Adding product…' : 'Add product'}
                    </button>

                    {status.text && (
                        <p className={`pp-status pp-status--${status.type}`} role="status">
                            {status.text}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}

export default PostProduct
