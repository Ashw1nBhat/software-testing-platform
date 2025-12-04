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

app.post('/api/auth/login', async (req, res) => {
  const { username, password, config = {} } = req.body ?? {}

  if (!username || !password) {
    res.status(400).json({ ok: false, error: 'Username and password are required' })
    return
  }

  try {
    const result = await callProcedure('login_user', [username, password], config)
    const payload = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    if (!payload) {
      res.status(500).json({ ok: false, error: 'Unexpected response from database' })
      return
    }
    res.json({ ok: true, user: payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    const status = message.toLowerCase().includes('invalid credentials') ? 401 : 500
    res.status(status).json({
      ok: false,
      error: message,
    })
  }
})

app.get('/api/auth/roles', async (req, res) => {
  try {
    const result = await callProcedure('get_roles')
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    const roles = rows.map((row) => row.role).filter(Boolean)
    res.json({ ok: true, roles })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load roles',
    })
  }
})

app.post('/api/auth/create', async (req, res) => {
  const { username, employeeCode, designation, role, password, config = {}, organizationId } =
    req.body ?? {}

  if (!username || !employeeCode || !role || !password) {
    res.status(400).json({ ok: false, error: 'Username, employee code, role, and password are required' })
    return
  }

  const orgId = organizationId || process.env.DEFAULT_ORG_ID || 1
  const joinDate = new Date().toISOString().slice(0, 10)

  try {
    const result = await callProcedure(
      'create_user',
      [orgId, username, employeeCode, designation || null, joinDate, role, password],
      config,
    )
    const payload = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    const userId = payload?.user_id
    res.json({ ok: true, userId })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'User creation failed',
    })
  }
})

app.listen(port, () => {
  console.log(`API server listening on ${port}`)
})
