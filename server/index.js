import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { callProcedure, testConnection } from './db.js'

dotenv.config()
dotenv.config({ path: '.env.local', override: false })

const app = express()
const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

app.post('/api/db/health', async (req, res) => {
  try {
    await testConnection(req.body)
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    })
  }
})

app.post('/api/db/procedure', async (req, res) => {
  const { name, params = [], config = {} } = req.body ?? {}

  if (!name) {
    res.status(400).json({ ok: false, error: 'Procedure name is required' })
    return
  }

  try {
    const result = await callProcedure(name, params, config)
    res.json({ ok: true, result })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Procedure call failed',
    })
  }
})

app.listen(port, () => {
  console.log(`API server listening on ${port}`)
})
