// Backend address. Set VITE_API_URL in a .env file to change it.

export API_URL = (import.meta.env.VITE_API_URL || "https://ecomerce-m62g.onrender.com//api").replace(/\/+$/, "")
// The same address without "/api". Uploaded images are served from here (e.g. http://localhost:4000/uploads/ab12.jpg)
export const SERVER_URL = API_URL.replace(/\/api$/, '')

// Currency shown next to prices. Change it to whatever you sell in.
export const CURRENCY = 'KES'

export const CATEGORY_LABELS = { men: 'Men', women: 'Women', kids: 'Kids' }

// 4500 -> "KES 4,500"
export const formatPrice = (value) =>
    `${CURRENCY} ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

// The database stores image paths like "/uploads/ab12.jpg". The browser needs the full address.
// Full links (https://...) are left alone.
export const imageUrl = (path) => {
    if (!path) return ''
    return /^https?:\/\//.test(path) ? path : SERVER_URL + path
}
