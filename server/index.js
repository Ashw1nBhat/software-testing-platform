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

app.get('/api/projects', async (req, res) => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId is required' })
    return
  }
  try {
    const result = await callProcedure('list_projects_by_org', [userId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, projects: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load projects',
    })
  }
})

app.post('/api/projects', async (req, res) => {
  const { userId, name, description = '' } = req.body ?? {}
  if (!userId || !name) {
    res.status(400).json({ ok: false, error: 'userId and name are required' })
    return
  }
  try {
    const result = await callProcedure('create_project_for_org', [userId, name, description])
    const payload = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    res.json({ ok: true, projectId: payload?.project_id })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to create project',
    })
  }
})

app.put('/api/projects/:id', async (req, res) => {
  const { userId, name, description = '' } = req.body ?? {}
  const projectId = req.params.id
  if (!userId || !projectId || !name) {
    res
      .status(400)
      .json({ ok: false, error: 'userId, projectId, and name are required' })
    return
  }
  try {
    await callProcedure('update_project_for_org', [userId, projectId, name, description])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update project',
    })
  }
})

app.delete('/api/projects/:id', async (req, res) => {
  const { userId } = req.body ?? {}
  const projectId = req.params.id
  if (!userId || !projectId) {
    res.status(400).json({ ok: false, error: 'userId and projectId are required' })
    return
  }
  try {
    await callProcedure('delete_project_for_org', [userId, projectId])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to delete project',
    })
  }
})

app.get('/api/projects/:projectId/test-cases', async (req, res) => {
  const { userId } = req.query
  const projectId = req.params.projectId
  if (!userId || !projectId) {
    res.status(400).json({ ok: false, error: 'userId and projectId are required' })
    return
  }
  try {
    const result = await callProcedure('list_test_cases_by_project', [userId, projectId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, testCases: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load test cases',
    })
  }
})

app.get('/api/test-cases/:id/steps', async (req, res) => {
  const { userId } = req.query
  const testCaseId = req.params.id
  if (!userId || !testCaseId) {
    res.status(400).json({ ok: false, error: 'userId and testCaseId are required' })
    return
  }
  try {
    const result = await callProcedure('list_test_steps_for_case', [userId, testCaseId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, steps: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load test steps',
    })
  }
})

app.post('/api/projects/:projectId/test-cases', async (req, res) => {
  const { userId, title, description = '', steps = [] } = req.body ?? {}
  const projectId = req.params.projectId
  if (!userId || !projectId || !title) {
    res.status(400).json({ ok: false, error: 'userId, projectId, and title are required' })
    return
  }
  try {
    const result = await callProcedure('create_test_case_for_org', [
      userId,
      projectId,
      title,
      description,
    ])
    const payload = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    const testCaseId = payload?.test_case_id
    for (const step of steps) {
      await callProcedure('create_test_step_for_case', [
        userId,
        testCaseId,
        step.description || '',
        step.required_data || null,
      ])
    }
    res.json({ ok: true, testCaseId })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to create test case',
    })
  }
})

app.put('/api/test-cases/:id', async (req, res) => {
  const { userId, title, description = '', steps = [] } = req.body ?? {}
  const testCaseId = req.params.id
  if (!userId || !testCaseId || !title) {
    res.status(400).json({ ok: false, error: 'userId, testCaseId, and title are required' })
    return
  }
  try {
    await callProcedure('update_test_case_for_org', [userId, testCaseId, title, description])
    await callProcedure('delete_test_steps_for_case', [userId, testCaseId])
    for (const step of steps) {
      await callProcedure('create_test_step_for_case', [
        userId,
        testCaseId,
        step.description || '',
        step.required_data || null,
      ])
    }
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update test case',
    })
  }
})

app.delete('/api/test-cases/:id', async (req, res) => {
  const { userId } = req.body ?? {}
  const testCaseId = req.params.id
  if (!userId || !testCaseId) {
    res.status(400).json({ ok: false, error: 'userId and testCaseId are required' })
    return
  }
  try {
    await callProcedure('delete_test_case_for_org', [userId, testCaseId])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to delete test case',
    })
  }
})

app.get('/api/org/users', async (req, res) => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId is required' })
    return
  }
  try {
    const result = await callProcedure('list_users_in_org', [userId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, users: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load users',
    })
  }
})

app.get('/api/org/test-cases', async (req, res) => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId is required' })
    return
  }
  try {
    const result = await callProcedure('list_test_cases_by_org', [userId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, testCases: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load test cases',
    })
  }
})

app.get('/api/projects/:projectId/test-runs', async (req, res) => {
  const { userId } = req.query
  const projectId = req.params.projectId
  if (!userId || !projectId) {
    res.status(400).json({ ok: false, error: 'userId and projectId are required' })
    return
  }
  try {
    const result = await callProcedure('list_test_runs_by_project', [userId, projectId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, testRuns: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load test runs',
    })
  }
})

app.get('/api/test-runs/:id/cases', async (req, res) => {
  const { userId } = req.query
  const testRunId = req.params.id
  if (!userId || !testRunId) {
    res.status(400).json({ ok: false, error: 'userId and testRunId are required' })
    return
  }
  try {
    const result = await callProcedure('list_test_run_cases', [userId, testRunId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, runCases: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load test run cases',
    })
  }
})

app.get('/api/test-runs/:id/summary', async (req, res) => {
  const { userId } = req.query
  const testRunId = req.params.id
  if (!userId || !testRunId) {
    res.status(400).json({ ok: false, error: 'userId and testRunId are required' })
    return
  }
  try {
    const result = await callProcedure('list_test_run_cases', [userId, testRunId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    const total = rows.length
    const byStatusMap = new Map()
    rows.forEach((r) => {
      const name = r.status_name || 'UNTESTED'
      const color = r.color_hex || null
      const entry = byStatusMap.get(name)
      if (entry) {
        entry.count += 1
      } else {
        byStatusMap.set(name, { name, color, count: 1 })
      }
    })
    const byStatus = Array.from(byStatusMap.values())
    res.json({ ok: true, summary: { total, byStatus } })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load test run summary',
    })
  }
})

app.get('/api/statuses', async (req, res) => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId is required' })
    return
  }
  try {
    const result = await callProcedure('list_statuses', [userId])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, statuses: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load statuses',
    })
  }
})

app.post('/api/statuses', async (req, res) => {
  const { userId, name, colorHex } = req.body ?? {}
  if (!userId || !name || !colorHex) {
    res.status(400).json({ ok: false, error: 'userId, name and colorHex are required' })
    return
  }
  try {
    await callProcedure('create_status', [userId, name, colorHex])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to create status',
    })
  }
})

app.put('/api/statuses/:name', async (req, res) => {
  const statusName = req.params.name
  const { userId, colorHex } = req.body ?? {}
  if (!userId || !statusName || !colorHex) {
    res.status(400).json({ ok: false, error: 'userId, name and colorHex are required' })
    return
  }
  try {
    await callProcedure('update_status', [userId, statusName, colorHex])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update status',
    })
  }
})

app.delete('/api/statuses/:name', async (req, res) => {
  const statusName = req.params.name
  const { userId } = req.body ?? {}
  if (!userId || !statusName) {
    res.status(400).json({ ok: false, error: 'userId and name are required' })
    return
  }
  try {
    await callProcedure('delete_status', [userId, statusName])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to delete status',
    })
  }
})

app.put('/api/test-runs/:id/cases/:caseId', async (req, res) => {
  const { userId, status, notes = '' } = req.body ?? {}
  const testRunId = req.params.id
  const caseId = req.params.caseId
  if (!userId || !testRunId || !caseId || !status) {
    res.status(400).json({ ok: false, error: 'userId, testRunId, caseId, and status are required' })
    return
  }
  try {
    await callProcedure('update_test_run_case_for_org', [userId, testRunId, caseId, status, notes])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update test run case',
    })
  }
})

app.post('/api/projects/:projectId/test-runs', async (req, res) => {
  const { userId, testerName, name, description = '', testCaseIds = [] } = req.body ?? {}
  const projectId = req.params.projectId
  if (!userId || !projectId || !testerName || !name) {
    res
      .status(400)
      .json({ ok: false, error: 'userId, projectId, testerName, and name are required' })
    return
  }
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    res.status(400).json({ ok: false, error: 'At least one test case is required' })
    return
  }
  try {
    const result = await callProcedure('create_test_run_for_org', [
      userId,
      projectId,
      testerName,
      name,
      description,
    ])
    const payload = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    const testRunId = payload?.test_run_id
    for (const tcId of testCaseIds) {
      await callProcedure('add_test_run_case_for_org', [userId, testRunId, tcId, 'UNTESTED'])
    }
    res.json({ ok: true, testRunId })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to create test run',
    })
  }
})

app.put('/api/test-runs/:id', async (req, res) => {
  const { userId, testerName, name, description = '', testCaseIds = [] } = req.body ?? {}
  const testRunId = req.params.id
  if (!userId || !testRunId || !testerName || !name) {
    res
      .status(400)
      .json({ ok: false, error: 'userId, testRunId, testerName, and name are required' })
    return
  }
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    res.status(400).json({ ok: false, error: 'At least one test case is required' })
    return
  }
  try {
    await callProcedure('update_test_run_for_org', [userId, testRunId, testerName, name, description])
    await callProcedure('delete_test_run_cases_for_run', [userId, testRunId])
    for (const tcId of testCaseIds) {
      await callProcedure('add_test_run_case_for_org', [userId, testRunId, tcId, 'UNTESTED'])
    }
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to update test run',
    })
  }
})

app.delete('/api/test-runs/:id', async (req, res) => {
  const { userId } = req.body ?? {}
  const testRunId = req.params.id
  if (!userId || !testRunId) {
    res.status(400).json({ ok: false, error: 'userId and testRunId are required' })
    return
  }
  try {
    await callProcedure('delete_test_run_for_org', [userId, testRunId])
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to delete test run',
    })
  }
})

app.get('/api/analytics/org', async (req, res) => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId is required' })
    return
  }
  try {
    const result = await callProcedure('list_org_stats', [userId])
    const totals = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    const statuses = Array.isArray(result) && Array.isArray(result[1]) ? result[1] : []
    res.json({ ok: true, totals, statuses })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load analytics',
    })
  }
})

app.get('/api/analytics/project', async (req, res) => {
  const { userId, projectId } = req.query
  if (!userId || !projectId) {
    res.status(400).json({ ok: false, error: 'userId and projectId are required' })
    return
  }
  try {
    const result = await callProcedure('list_project_stats', [userId, projectId])
    const totals = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0] : null
    const statuses = Array.isArray(result) && Array.isArray(result[1]) ? result[1] : []
    res.json({ ok: true, totals, statuses })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load project analytics',
    })
  }
})

app.get('/api/analytics/recent', async (req, res) => {
  const { userId, limit } = req.query
  const max = Number(limit) || 10
  if (!userId) {
    res.status(400).json({ ok: false, error: 'userId is required' })
    return
  }
  try {
    const result = await callProcedure('list_org_recent_activity', [userId, Math.min(max, 50)])
    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []
    res.json({ ok: true, activity: rows })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load recent activity',
    })
  }
})

app.listen(port, () => {
  console.log(`API server listening on ${port}`)
})
