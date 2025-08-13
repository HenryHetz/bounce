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

// ===== статика =====
app.use('/bounce', express.static(path.join(__dirname, 'bounce')))
app.use('/', express.static(path.join(__dirname, 'landing')))
app.use(bodyParser.json())

// ===== опционально: healthcheck =====
app.get('/api/ping', (req, res) => res.json({ pong: true }))

// ===== если хочешь редиректить HTTP -> HTTPS =====
const redirectApp = express()
redirectApp.use((req, res) => {
  const host = req.headers.host || 'kingo.bingo'
  return res.redirect(301, `https://${host}${req.url}`)
})

const HTTP_PORT = 80
const HTTPS_PORT = 443

// ===== HTTPS options =====
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/kingo.bingo/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/kingo.bingo/fullchain.pem'),
}

// Поднимаем два сервера:
// 1) http → редирект на https
http.createServer(redirectApp).listen(HTTP_PORT, () => {
  console.log(`HTTP redirect on :${HTTP_PORT}`)
})

// 2) https → Express со статикой и API
https.createServer(options, app).listen(HTTPS_PORT, () => {
  console.log(`HTTPS app on :${HTTPS_PORT}`)
})

// таблица и краш индекс
function generateCrashTable({ minPayout, maxPayout, steps, houseEdge = 1 }) {
  const ratio = Math.pow(maxPayout / minPayout, 1 / (steps - 2))
  const RTP = 1 - houseEdge / 100
  let acc = 0
  const table = []

  for (let i = 0; i < steps; i++) {
    let multiplier, base
    if (i === 0) {
      multiplier = 1 // на клиенте у тебя сейчас 1, ранее было 0 — придерживаемся 1
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

// POST /api/crash-table  -> { table }
app.post('/api/crash-table', (req, res) => {
  try {
    const { minPayout, maxPayout, steps, houseEdge } = req.body
    const table = generateCrashTable({ minPayout, maxPayout, steps, houseEdge })
    res.json({ ok: true, table })
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message })
  }
})

// POST /api/round/start -> { crashIndex, seed }  (seed опционально для fair‑логов)
app.post('/api/round/start', (req, res) => {
  try {
    const { table } = req.body // передаём из клиента последнюю таблицу (или храним на сервере по сессии)
    if (!Array.isArray(table) || table.length === 0) {
      return res.status(400).json({ ok: false, error: 'No crash table' })
    }

    // криптографический rng
    const r = crypto.randomInt(0, 1e9) / 1e9 // 0..1
    let iFound = 0

    for (let i = 0; i < table.length; i++) {
      if (r < table[i].acc) {
        iFound = i
        break
      }
    }
    let crashIndex = iFound > 0 ? iFound + 1 : 0 // как у тебя сейчас
    res.json({ ok: true, crashIndex, rand: r })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})
