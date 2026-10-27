require('dotenv').config()   // load .env first

const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// path to your routes file (the one with /register, /login and /product). Adjust it to match your folders.
const apiRoutes = require('./routes/auth')

const app = express()

/* ============================ CORS ============================
   Any localhost port is allowed while developing (Vite can move between 5173, 5174...).
   For a deployed frontend, set CLIENT_ORIGIN in .env / Render, e.g. https://my-shop.vercel.app
   Several origins can be given, separated by commas. */
const extraOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))   // browsers never send a trailing slash
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // no Origin header = not a browser (curl, Postman, health checks): allow it
      if (!origin) return callback(null, true)
      if (/^http:\/\/localhost:\d+$/.test(origin) || extraOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, false)   // not on the list: the browser will block it
    },
  })
)

app.use(express.json())

// uploaded product images -> http://localhost:4000/uploads/<file>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// quick check that the server is alive
app.get('/', (req, res) => res.json({ status: 'ok' }))

// all API routes live under /api  ->  /api/register, /api/login, /api/product
app.use('/api', apiRoutes)

// anything that matched no route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// last stop for errors, so the client always gets JSON instead of an HTML error page
app.use((err, req, res, next) => {   // eslint-disable-line no-unused-vars
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in the request body.' })
  }
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on our side.' })
})

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI

const startServer = async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing in your .env file')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URI)
    console.log('App is connected to the database.')

    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`)
    })
  } catch (error) {
    console.error(`Error starting server: ${error.message}`)
    process.exit(1)
  }
}

startServer()