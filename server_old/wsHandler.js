export function handleWSConnection(ws) {
  console.log('✅ WebSocket client connected')

  ws.on('message', (data) => {
    const msg = data.toString()
    console.log('📨 Client says:', msg)

    // простое эхо
    ws.send(`Echo: ${msg}`)
  })

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed')
  })

  ws.on('error', (err) => {
    console.error('⚠️ WebSocket error:', err)
  })
}
