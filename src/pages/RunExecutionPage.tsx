import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

type RunCase = {
  test_case_id: number
  status_name: string
  notes: string | null
  title: string
  description: string | null
}
type TestStep = { test_step_id: number; description: string; required_data: string | null }

type Status = 'idle' | 'loading' | 'error' | 'saving'

const friendlyError = (error: unknown) => {
  const msg = axios.isAxiosError(error)
    ? error.response?.data?.error || error.message
    : error instanceof Error
    ? error.message
    : ''
  if (msg) {
    const lower = msg.toLowerCase()
    if (lower.includes('user not found')) return 'User does not exist'
    if (lower.includes('duplicate') || lower.includes('already exists')) return 'Already exists'
    if (lower.includes('invalid credentials')) return 'Invalid credentials'
  }
  return 'Unexpected error occurred'
}

function RunExecutionPage() {
  const { runId } = useParams<{ runId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const user = (location.state as { user?: { user_id: number; organization_id: number }; projectId?: string; run?: { name: string } } | undefined)?.user
  const projectId = (location.state as { projectId?: string } | undefined)?.projectId
  const runMeta = (location.state as { run?: { name: string } } | undefined)?.run
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000',
    [],
  )

  const [cases, setCases] = useState<RunCase[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [caseStatus, setCaseStatus] = useState<string>('')
  const [caseNotes, setCaseNotes] = useState<string>('')
  const [steps, setSteps] = useState<TestStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(false)
  const [saveTick, setSaveTick] = useState(false)
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])

  const currentCase = cases[currentIndex]

  const loadRunCases = async () => {
    if (!user || !runId) return
    setStatus('loading')
    setMessage('')
    try {
      const response = await axios.get(`${apiBase}/api/test-runs/${runId}/cases`, {
        params: { userId: user.user_id },
      })
      const rows: RunCase[] = response.data?.runCases || []
      setCases(rows)
      setCurrentIndex(0)
      if (rows.length > 0) {
        setCaseStatus(rows[0].status_name === 'UNTESTED' ? '' : rows[0].status_name || '')
        setCaseNotes(rows[0].notes || '')
        loadStepsForCase(rows[0].test_case_id)
      }
    } catch (error) {
      setStatus('error')
      setMessage(friendlyError(error))
    } finally {
      setStatus('idle')
    }
  }

  const loadStepsForCase = async (caseId: number) => {
    if (!user) return
    setStepsLoading(true)
    try {
      const response = await axios.get(`${apiBase}/api/test-cases/${caseId}/steps`, {
        params: { userId: user.user_id },
      })
      const rows: TestStep[] = response.data?.steps || []
      setSteps(rows)
    } catch {
      setSteps([])
    } finally {
      setStepsLoading(false)
    }
  }

  useEffect(() => {
    const loadStatuses = async () => {
      if (!user) return
      try {
        const response = await axios.get(`${apiBase}/api/statuses`, { params: { userId: user.user_id } })
        const names = (response.data?.statuses || [])
          .map((s: any) => s.status_name)
          .filter((name: string) => name !== 'UNTESTED')
        setAvailableStatuses(names.length ? names : ['PASS', 'FAIL'])
      } catch (error) {
        console.error('Failed to load statuses', error)
        setAvailableStatuses(['PASS', 'FAIL'])
      }
    }
    loadRunCases()
    loadStatuses()
  }, [user, runId])

  const handleSelectCase = (index: number) => {
    setCurrentIndex(index)
    const target = cases[index]
    setCaseStatus(target?.status_name === 'UNTESTED' ? '' : target?.status_name || '')
    setCaseNotes(target?.notes || '')
    setSaveTick(false)
    if (target) {
      loadStepsForCase(target.test_case_id)
    }
  }

  const handleSave = async () => {
    if (!user || !runId || !currentCase || !caseStatus) return
    setStatus('saving')
    setMessage('')
    try {
      await axios.put(`${apiBase}/api/test-runs/${runId}/cases/${currentCase.test_case_id}`, {
        userId: user.user_id,
        status: caseStatus,
        notes: caseNotes,
      })
      setCases((prev) =>
        prev.map((rc, idx) =>
          idx === currentIndex ? { ...rc, status_name: caseStatus, notes: caseNotes } : rc,
        ),
      )
      setSaveTick(true)
      setTimeout(() => setSaveTick(false), 2000)
    } catch (error) {
      setStatus('error')
      setMessage(friendlyError(error))
    } finally {
      setStatus('idle')
    }
  }

  if (!user || !runId) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            <Card className="glass-card shadow-sm">
              <Card.Body className="d-flex flex-column gap-3">
                <h4 className="mb-0">Session expired</h4>
                <p className="text-muted mb-0">Please log in again to continue.</p>
                <div>
                  <Link to="/login" className="btn btn-primary">
                    Go to login
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10} md={11}>
          <div className="page-header d-flex align-items-center justify-content-between">
            <div>
              <p className="eyebrow">Test run #{runId}</p>
              <h1>{runMeta?.name || 'Run execution'}</h1>
              <p className="subtitle">Walk through each test case, set status, and add notes.</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-light"
                className="soft-button"
                onClick={() =>
                  projectId
                    ? navigate(`/projects/${projectId}`, { state: { user } })
                    : navigate(-1)
                }
              >
                Return
              </Button>
            </div>
          </div>

          <Card className="glass-card shadow-sm">
            <Card.Body className="d-grid gap-3">
              {status === 'error' && (
                <Alert variant="danger" className="mb-0">
                  {message}
                </Alert>
              )}

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted">Case</span>
                  <Form.Select
                    value={String(currentIndex)}
                    onChange={(e) => handleSelectCase(Number(e.target.value))}
                    style={{ width: '220px' }}
                  >
                    {cases.map((c, idx) => (
                      <option key={c.test_case_id} value={idx}>
                        {idx + 1}. {c.title}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-light"
                    className="soft-button"
                    disabled={currentIndex === 0}
                    onClick={() => handleSelectCase(Math.max(0, currentIndex - 1))}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="outline-light"
                    className="soft-button"
                    disabled={currentIndex >= cases.length - 1}
                    onClick={() => handleSelectCase(Math.min(cases.length - 1, currentIndex + 1))}
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {currentCase ? (
                <div className="d-grid gap-3">
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div>
                      <h5 className="mb-1">{currentCase.title}</h5>
                      <p className="text-muted mb-0">
                        {currentCase.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {caseStatus ? (
                        <span
                          className={`status-pill ${
                            caseStatus === 'PASS' ? 'status-pass' : 'status-fail'
                          }`}
                        >
                          {caseStatus}
                        </span>
                      ) : (
                        <span className="status-pill status-none">No status</span>
                      )}
                      <Badge bg="secondary">#{currentCase.test_case_id}</Badge>
                    </div>
                  </div>

                  <Card className="glass-card shadow-sm">
                    <Card.Body>
                      <h6 className="mb-3">Steps</h6>
                      {stepsLoading ? (
                        <div className="d-flex align-items-center gap-2 text-muted">
                          <Spinner animation="border" size="sm" />
                          <span>Loading steps…</span>
                        </div>
                      ) : steps.length === 0 ? (
                        <div className="text-muted">No steps for this test case.</div>
                      ) : (
                        <div className="step-list">
                          {steps.map((step, idx) => (
                            <div key={step.test_step_id} className="step-item">
                              <div className="step-pill">{idx + 1}</div>
                              <div className="step-content">
                                <div className="step-title">{step.description}</div>
                                {step.required_data && (
                                  <div className="step-data">Data: {step.required_data}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="caseStatus">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={caseStatus}
                          onChange={(e) => setCaseStatus(e.target.value)}
                        >
                          <option value="">Select status</option>
                          {availableStatuses.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="caseNotes">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                          type="text"
                          value={caseNotes}
                          onChange={(e) => setCaseNotes(e.target.value)}
                          placeholder="Optional notes"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleSave} disabled={status === 'saving' || !caseStatus}>
                      {status === 'saving' && <Spinner animation="border" size="sm" className="me-2" />}
                      Save status
                    </Button>
                    {saveTick && (
                      <span className="text-success fw-semibold d-flex align-items-center">
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted">No test cases attached to this run.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default RunExecutionPage
