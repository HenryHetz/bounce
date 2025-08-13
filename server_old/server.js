import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { handleWSConnection } from './wsHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 1. Static
app.use(express.static(path.join(__dirname, '..', 'dist')))

// 2. Catch-all route to index.html in dist
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

// 3. HTTP Server
const server = http.createServer(app)

// 4. WS Server
const wss = new WebSocketServer({ server })
wss.on('connection', handleWSConnection)

server.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`)
})
