const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const multer = require('multer')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const router = express.Router()

const User = require('../models/user')
const product = require('../models/product')
const Order = require('../models/order')

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

const CATEGORIES = ['men', 'women', 'kids']

// the shape sent to the website. Price is converted to a real number,
// even for older products that stored it as text.
const toProduct = (p) => ({
    _id: p._id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image: p.image,
    category: p.category,
    createdAt: p.createdAt,
})

/* ============================ IMAGE UPLOADS ============================
   multer reads the multipart form: text fields go to req.body, the file to req.file */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')   // server/uploads
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
    storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        // random file name, so two uploads can never overwrite each other
        filename: (req, file, cb) =>
            cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },   // 5 MB
    fileFilter: (req, file, cb) => {
        const ok = IMAGE_TYPES.includes(file.mimetype)
        cb(ok ? null : new Error('INVALID_IMAGE'), ok)
    },
}).single('image')   // 'image' must match the name the form uses: data.append('image', file)

// runs multer and turns its errors into normal JSON errors
const handleUpload = (req, res, next) =>
    upload(req, res, (err) => {
        if (!err) return next()
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'The image must be 5 MB or smaller.' })
        }
        if (err.message === 'INVALID_IMAGE') {
            return res.status(400).json({ message: 'The image must be a JPG, PNG or WebP file.' })
        }
        console.error(err)
        return res.status(400).json({ message: 'Could not upload the image.' })
    })

// deletes an uploaded file when the request fails, so rejected attempts leave nothing behind
const removeFile = (file) => {
    if (file) fs.unlink(file.path, () => {})
}

/* ============================ REGISTER ============================ */
router.post('/register', async (req, res) => {
    try {
        const body = req.body || {}
        const firstName = String(body.firstName || '').trim()
        const lastName = String(body.lastName || '').trim()
        const email = String(body.email || '').trim().toLowerCase()
        const phone = String(body.phone || '').trim()
        const password = typeof body.password === 'string' ? body.password : ''

        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'firstName and lastName are required' })
        }
        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Enter a valid email address.' })
        }
        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({ message: 'Password must be 8 to 72 characters.' })
        }

        if (await User.exists({ email })) {
            return res.status(409).json({ message: 'A user with such email exists' })
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        await User.create({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword
        })
        res.status(201).json({ message: 'User created successfully' })

    } catch (err) {
        if (err.code === 11000) {
            // shows which field really collided (a leftover unique index shows up here)
            console.error('Duplicate key error on:', err.keyPattern, err.keyValue)
            const field = Object.keys(err.keyPattern || {})[0] || 'email'
            if (field === 'email') {
                return res.status(409).json({ message: 'A user with such email exists' })
            }
            return res.status(409).json({ message: `A user with this ${field} already exists` })
        }
        console.error(err)
        res.status(500).json({ message: 'Something went wrong on our side.' })
    }
})

/* ============================ ADD PRODUCT ============================
   multipart/form-data: name, description, price, category (men|women|kids), image (file) */
router.post('/product', handleUpload, async (req, res) => {   // handleUpload MUST come first
    try {
        const body = req.body || {}
        const name = String(body.name || '').trim()
        const description = String(body.description || '').trim()
        const category = String(body.category || '').trim().toLowerCase()
        const price = body.price === '' || body.price == null ? NaN : Number(body.price)

        if (!name || !description) {
            removeFile(req.file)
            return res.status(400).json({ message: 'Name and description are required.' })
        }
        if (!CATEGORIES.includes(category)) {
            removeFile(req.file)
            return res.status(400).json({ message: 'Category must be men, women or kids.' })
        }
        if (!Number.isFinite(price) || price < 0) {
            removeFile(req.file)
            return res.status(400).json({ message: 'Price must be a number of 0 or more.' })
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please choose a product image.' })
        }

        if (await product.exists({ name })) {
            removeFile(req.file)
            return res.status(409).json({ message: 'Product already exists' })
        }

        await product.create({
            name,
            description,
            price,
            category,
            image: `/uploads/${req.file.filename}`,
        })
        return res.status(201).json({ message: 'Product added successfully' })

    } catch (err) {
        removeFile(req.file)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message })
        }
        console.error(err)
        return res.status(500).json({ message: 'There was a problem adding your product' })
    }
})

/* ============================ NEW: LIST PRODUCTS ============================
   GET /api/products                 -> newest first
   GET /api/products?category=men    -> only men's products  */
router.get('/products', async (req, res) => {
    try {
        const filter = {}
        const category = String(req.query.category || '').trim().toLowerCase()
        if (category) {
            if (!CATEGORIES.includes(category)) {
                return res.status(400).json({ message: 'Category must be men, women or kids.' })
            }
            filter.category = category
        }

        const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 24))
        const items = await product.find(filter).sort({ createdAt: -1 }).limit(limit).lean()

        res.json({ products: items.map(toProduct) })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Could not load products.' })
    }
})

/* ============================ NEW: ONE PRODUCT ============================
   GET /api/products/:id  -> all the details of a single product  */
router.get('/products/:id', async (req, res) => {
    try {
        // an id that is not a valid MongoDB id would make findById throw, so reject it first
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: 'Product not found.' })
        }
        const item = await product.findById(req.params.id).lean()
        if (!item) {
            return res.status(404).json({ message: 'Product not found.' })
        }
        res.json({ product: toProduct(item) })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Could not load the product.' })
    }
})

/* ============================ NEW: PLACE AN ORDER ============================
   JSON: { productId, quantity, name, phone, address, note }
   The price and total are taken from the database, never from the browser.  */
router.post('/orders', async (req, res) => {
    try {
        const b = req.body || {}
        const productId = String(b.productId || '')
        const quantity = Number(b.quantity)
        const customerName = String(b.name || '').trim()
        const phone = String(b.phone || '').trim()
        const address = String(b.address || '').trim()
        const note = String(b.note || '').trim().slice(0, 500)

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product.' })
        }
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
            return res.status(400).json({ message: 'Quantity must be a whole number from 1 to 20.' })
        }
        if (customerName.length < 2) {
            return res.status(400).json({ message: 'Please enter your name.' })
        }
        if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) {
            return res.status(400).json({ message: 'Enter a valid phone number.' })
        }
        if (address.length < 5) {
            return res.status(400).json({ message: 'Please enter your delivery address.' })
        }

        const item = await product.findById(productId).lean()
        if (!item) {
            return res.status(404).json({ message: 'This product is no longer available.' })
        }

        const unitPrice = Number(item.price)
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            return res.status(400).json({ message: 'This product has no valid price.' })
        }
        const total = Math.round(unitPrice * quantity * 100) / 100

        const created = await Order.create({
            product: item._id,
            productName: item.name,
            unitPrice,
            quantity,
            total,
            customerName,
            phone,
            address,
            note,
        })

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: created._id,
                productName: created.productName,
                quantity: created.quantity,
                total: created.total,
                status: created.status,
            },
        })
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message })
        }
        console.error(err)
        res.status(500).json({ message: 'There was a problem placing your order.' })
    }
})

/* ============================ LOGIN ============================ */
router.post('/login', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase()
        const password = typeof req.body?.password === 'string' ? req.body.password : ''
        const user = email && password ? await User.findOne({ email }) : null
        const ok = user && await bcrypt.compare(password, user.password)

        if (!ok) {
            return res.status(401).json({ message: 'Incorrect email or password.' })
        }
        return res.status(200).json({ message: 'Login success' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'There was an error while trying to sign you in' })
    }
})

module.exports = router