// server.js
import express from 'express'
import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import bodyParser from 'body-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.set('trust proxy', true) // чтобы в логах был реальный IP за прокси/Cloudflare

// ====== ПАРОЛЬ ДЛЯ ДЕМО ======
const DEMO_PASSWORD = 'bounce'

// Helpers
const assetRe =
  /\.(png|jpe?g|webp|gif|svg|ico|mp3|mp4|wav|ogg|ttf|otf|woff2?|css|js|map)$/i
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ====== BASIC AUTH ======
function parseBasicAuth(header) {
  if (!header || !header.startsWith('Basic ')) return null
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  if (idx === -1) return null
  return { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) }
}

function demoGuard(req, res, next) {
  const creds = parseBasicAuth(req.headers.authorization)
  if (!creds || creds.password !== DEMO_PASSWORD) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="kingo.bingo demo", charset="UTF-8"'
    )
    return res.status(401).send('Authentication required')
  }
  // const who = (creds.username || 'unknown').replace(/\s+/g, ' ').slice(0, 200)
  // Мини-валидация: просим ввести email как логин
  if (!creds.username || !emailRe.test(creds.username)) {
    return res.status(401).send('Use your email as login')
  }
  const who = creds.username.slice(0, 200)
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip
  const ua = req.headers['user-agent'] || '-'
  // const line = `${new Date().toISOString()} who="${who}" ip=${ip} method=${req.method} path=${req.originalUrl} ua="${ua}"\n`
  // try {
  //   fs.appendFileSync(path.join(__dirname, 'access.log'), line)
  // } catch {}
  // console.log('[DEMO ACCESS]', line.trim())
  // Шум фильтруем: логируем только API и первый заход на /bounce/
  const isApi = req.originalUrl.startsWith('/api/')
  const isEntry =
    req.originalUrl === '/bounce/' || req.originalUrl.endsWith('/index.html')
  const isAsset = assetRe.test(req.originalUrl)
  if (isApi || isEntry || !isAsset) {
    const line = `${new Date().toISOString()} who="${who}" ip=${ip} method=${req.method} path=${req.originalUrl} ua="${ua}"\n`
    try {
      fs.appendFileSync(path.join(__dirname, 'access.log'), line)
    } catch {}
    console.log('[DEMO ACCESS]', line.trim())
  }
  req.demoUser = who
  next()
}

// ===== JSON body =====
app.use(bodyParser.json())

// ===== Healthcheck (открыт для всех) =====
app.get('/api/ping', (req, res) => res.json({ pong: true }))

// ===== Защита на игру и API =====
app.use('/api', demoGuard) // все API (кроме /api/ping выше)
app.use('/bounce', demoGuard) // сами файлы игры

// ===== Статика =====
app.use('/bounce', express.static(path.join(__dirname, 'bounce')))
app.use('/', express.static(path.join(__dirname, 'landing')))

// ===== HTTP → HTTPS редирект =====
const HTTP_PORT = 80
const HTTPS_PORT = 443
const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`🚀 DEV server on http://localhost:${PORT}`)
  })
} else {
  const httpApp = express()
  httpApp.use((req, res) => {
    const host = req.headers.host?.replace(/:80$/, '') || 'kingo.bingo'
    res.redirect(301, `https://${host}${req.url}`)
  })
  http.createServer(httpApp).listen(80, () => console.log('HTTP redirect :80'))

  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/kingo.bingo/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/kingo.bingo/fullchain.pem'),
  }
  https.createServer(options, app).listen(443, () => {
    console.log('🔒 HTTPS :443')
  })
}

// ===== ЛОГИКА ИГРЫ =====
let HOUSE_EDGE = 1 // дефолт 1%

app.get('/api/house-edge', (req, res) => {
  res.json({ ok: true, houseEdge: HOUSE_EDGE })
})

app.post('/api/house-edge', (req, res) => {
  const { houseEdge } = req.body || {}
  const val = Number(houseEdge)
  if (!isFinite(val)) {
    return res.status(400).json({ ok: false, error: 'bad number' })
  }
  HOUSE_EDGE = val
  res.json({ ok: true, houseEdge: HOUSE_EDGE })
})

function generateCrashTable({ minPayout, maxPayout, steps }) {
  const ratio = Math.pow(maxPayout / minPayout, 1 / (steps - 2))
  const RTP = 1 - HOUSE_EDGE / 100
  let acc = 0
  const table = []

  for (let i = 0; i < steps; i++) {
    let multiplier, base
    if (i === 0) {
      multiplier = 1
      base = 0
    } else {
      multiplier = minPayout * Math.pow(ratio, i - 1)
      base = RTP / multiplier
    }
    table.push({
      step: i,
      multiplier,
      probability: undefined,
      acc: undefined,
      base,
    })
  }

  for (let i = table.length - 1; i >= 0; i--) {
    if (i < table.length - 1 && i !== 0) {
      table[i].probability = table[i].base - table[i + 1].base
    } else {
      table[i].probability = table[i].base
    }
    table[i].acc = 1 - acc
    acc += table[i].probability
    if (i === 0) table[i].probability = 1 - acc
  }
  return table
}

function assertNumber(n, name) {
  if (typeof n !== 'number' || Number.isNaN(n) || !Number.isFinite(n)) {
    throw new Error(`${name} must be a finite number`)
  }
}
function assertInt(n, name) {
  assertNumber(n, name)
  if (!Number.isInteger(n)) throw new Error(`${name} must be an integer`)
}

app.post('/api/crash-table', (req, res) => {
  try {
    const { minPayout, maxPayout, steps } = req.body
    assertNumber(minPayout, 'minPayout')
    assertNumber(maxPayout, 'maxPayout')
    assertInt(steps, 'steps')
    if (minPayout <= 0 || maxPayout <= minPayout || steps < 3) {
      throw new Error('Invalid crash table params')
    }
    const table = generateCrashTable({ minPayout, maxPayout, steps })
    res.json({ ok: true, table })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

app.post('/api/crash-index', (req, res) => {
  try {
    const { table } = req.body
    if (!Array.isArray(table) || table.length === 0) {
      return res.status(400).json({ ok: false, error: 'No crash table' })
    }
    const r = crypto.randomInt(0, 1e9) / 1e9
    console.log('crypto.randomInt', r)
    let iFound = 0
    for (let i = 0; i < table.length; i++) {
      if (r < table[i].acc) {
        iFound = i
        break
      }
    }
    const crashIndex = iFound > 0 ? iFound + 1 : 0
    res.json({ ok: true, crashIndex, rand: r })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})
