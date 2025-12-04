import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, ListGroup, Modal, Nav, Row, Spinner } from 'react-bootstrap'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

type TestCase = { test_case_id: number; title: string; description: string | null }
type TestStep = { test_step_id?: number; description: string; required_data: string | null }
type TestRun = {
  test_run_id: number
  project_id: number
  tester_id: number
  tester_name: string
  name: string
  description: string | null
}
type OrgUser = { user_id: number; user_name: string; role: string; designation: string | null }
type Status = 'idle' | 'loading' | 'error'
type RunSummary = { total: number; byStatus: { name: string; color: string | null; count: number }[] }

function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const user = (location.state as { user?: { user_id: number; organization_id: number } } | undefined)
    ?.user
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000',
    [],
  )

  const maxTitle = 200
  const maxDescription = 1000
  const maxStepDescription = 1000
  const maxRequiredData = 500

  const [activeTab, setActiveTab] = useState<'cases' | 'runs'>('cases')
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [runSummaries, setRunSummaries] = useState<Record<number, RunSummary>>({})
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([])
  const [steps, setSteps] = useState<TestStep[]>([{ description: '', required_data: '' }])
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [messageRuns, setMessageRuns] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [activeCase, setActiveCase] = useState<TestCase | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [showCreateRun, setShowCreateRun] = useState(false)
  const [showEditRun, setShowEditRun] = useState(false)
  const [showDeleteRun, setShowDeleteRun] = useState(false)
  const [activeRun, setActiveRun] = useState<TestRun | null>(null)
  const [runNameInput, setRunNameInput] = useState('')
  const [runDescInput, setRunDescInput] = useState('')
  const [runTesterId, setRunTesterId] = useState<number | ''>('')
  const [runCaseIds, setRunCaseIds] = useState<number[]>([])

  const loadTestCases = async () => {
    if (!user || !projectId) return
    setStatus('loading')
    setMessage('')
    try {
      const response = await axios.get(`${apiBase}/api/projects/${projectId}/test-cases`, {
        params: { userId: user.user_id },
      })
      const rows = response.data?.testCases || []
      setTestCases(rows)
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load test cases'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const loadTestRuns = async () => {
    if (!user || !projectId) return
    try {
      const response = await axios.get(`${apiBase}/api/projects/${projectId}/test-runs`, {
        params: { userId: user.user_id },
      })
      const rows = response.data?.testRuns || []
      setTestRuns(rows)
      fetchRunSummaries(rows)
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load test runs'
      setMessageRuns(reason)
    }
  }

  const fetchRunSummaries = async (runs: TestRun[]) => {
    if (!user) return
    try {
      const results = await Promise.all(
        runs.map(async (r) => {
          const res = await axios.get(`${apiBase}/api/test-runs/${r.test_run_id}/summary`, {
            params: { userId: user.user_id },
          })
          return { id: r.test_run_id, summary: res.data?.summary as RunSummary }
        }),
      )
      const map: Record<number, RunSummary> = {}
      results.forEach(({ id, summary }) => {
        map[id] = summary
      })
      setRunSummaries(map)
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load test run summaries'
      setMessageRuns(reason)
    }
  }

  const loadOrgUsers = async () => {
    if (!user) return
    try {
      const response = await axios.get(`${apiBase}/api/org/users`, {
        params: { userId: user.user_id },
      })
      const rows = response.data?.users || []
      setOrgUsers(rows)
      if (!runTesterId && rows.length > 0) {
        setRunTesterId(rows[0].user_id)
      }
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load users'
      setMessageRuns(reason)
    }
  }

  useEffect(() => {
    loadTestCases()
    loadTestRuns()
    loadOrgUsers()
  }, [user, projectId])

  const resetForm = () => {
    setTitleInput('')
    setDescInput('')
    setSteps([{ description: '', required_data: '' }])
  }

  const openCreate = () => {
    resetForm()
    setShowCreate(true)
  }

  const openEdit = async (testCase: TestCase) => {
    setActiveCase(testCase)
    setTitleInput(testCase.title)
    setDescInput(testCase.description || '')
    setStatus('loading')
    setMessage('')
    try {
      const response = await axios.get(`${apiBase}/api/test-cases/${testCase.test_case_id}/steps`, {
        params: { userId: user?.user_id },
      })
      const rows = response.data?.steps || []
      setSteps(
        rows.length > 0
          ? rows.map((step: any) => ({
              test_step_id: step.test_step_id,
              description: step.description || '',
              required_data: step.required_data || '',
            }))
          : [{ description: '', required_data: '' }],
      )
      setShowEdit(true)
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load test steps'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const openDelete = (testCase: TestCase) => {
    setActiveCase(testCase)
    setShowDelete(true)
  }

  const openCreateRun = () => {
    setRunNameInput('')
    setRunDescInput('')
    setRunCaseIds([])
    if (orgUsers.length > 0) {
      setRunTesterId(orgUsers[0].user_id)
    }
    setShowCreateRun(true)
  }

  const openEditRun = async (testRun: TestRun) => {
    setActiveRun(testRun)
    setRunNameInput(testRun.name)
    setRunDescInput(testRun.description || '')
    setRunTesterId(testRun.tester_id)
    setStatus('loading')
    setMessageRuns('')
    try {
      const response = await axios.get(`${apiBase}/api/test-runs/${testRun.test_run_id}/cases`, {
        params: { userId: user?.user_id },
      })
      const rows = response.data?.runCases || []
      setRunCaseIds(rows.map((rc: any) => rc.test_case_id))
      setShowEditRun(true)
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load test run cases'
      setMessageRuns(reason)
    } finally {
      setStatus('idle')
    }
  }

  const openDeleteRun = (testRun: TestRun) => {
    setActiveRun(testRun)
    setShowDeleteRun(true)
  }

  const handleCreate = async () => {
    if (!user || !projectId || !titleInput) return
    const overLimit =
      titleInput.length > maxTitle ||
      descInput.length > maxDescription ||
      steps.some(
        (s) => s.description.length > maxStepDescription || (s.required_data || '').length > maxRequiredData,
      )
    if (overLimit) return
    setStatus('loading')
    setMessage('')
    try {
      await axios.post(`${apiBase}/api/projects/${projectId}/test-cases`, {
        userId: user.user_id,
        title: titleInput,
        description: descInput,
        steps,
      })
      setShowCreate(false)
      resetForm()
      await loadTestCases()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to create test case'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleEdit = async () => {
    if (!user || !activeCase || !titleInput) return
    const overLimit =
      titleInput.length > maxTitle ||
      descInput.length > maxDescription ||
      steps.some(
        (s) => s.description.length > maxStepDescription || (s.required_data || '').length > maxRequiredData,
      )
    if (overLimit) return
    setStatus('loading')
    setMessage('')
    try {
      await axios.put(`${apiBase}/api/test-cases/${activeCase.test_case_id}`, {
        userId: user.user_id,
        title: titleInput,
        description: descInput,
        steps,
      })
      setShowEdit(false)
      setActiveCase(null)
      resetForm()
      await loadTestCases()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to update test case'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleDelete = async () => {
    if (!user || !activeCase) return
    setStatus('loading')
    setMessage('')
    try {
      await axios.delete(`${apiBase}/api/test-cases/${activeCase.test_case_id}`, {
        data: { userId: user.user_id },
      })
      setShowDelete(false)
      setActiveCase(null)
      await loadTestCases()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to delete test case'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleCreateRun = async () => {
    if (!user || !projectId || !runNameInput || !runTesterId) return
    const overLimit =
      runNameInput.length > 150 ||
      runDescInput.length > 1000 ||
      runCaseIds.length === 0
    if (overLimit) return
    setStatus('loading')
    setMessageRuns('')
    try {
      await axios.post(`${apiBase}/api/projects/${projectId}/test-runs`, {
        userId: user.user_id,
        testerId: runTesterId,
        name: runNameInput,
        description: runDescInput,
        testCaseIds: runCaseIds,
      })
      setShowCreateRun(false)
      setRunCaseIds([])
      await loadTestRuns()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to create test run'
      setMessageRuns(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleEditRun = async () => {
    if (!user || !activeRun || !runNameInput || !runTesterId) return
    const overLimit =
      runNameInput.length > 150 ||
      runDescInput.length > 1000 ||
      runCaseIds.length === 0
    if (overLimit) return
    setStatus('loading')
    setMessageRuns('')
    try {
      await axios.put(`${apiBase}/api/test-runs/${activeRun.test_run_id}`, {
        userId: user.user_id,
        testerId: runTesterId,
        name: runNameInput,
        description: runDescInput,
        testCaseIds: runCaseIds,
      })
      setShowEditRun(false)
      setActiveRun(null)
      setRunCaseIds([])
      await loadTestRuns()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to update test run'
      setMessageRuns(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleDeleteRun = async () => {
    if (!user || !activeRun) return
    setStatus('loading')
    setMessageRuns('')
    try {
      await axios.delete(`${apiBase}/api/test-runs/${activeRun.test_run_id}`, {
        data: { userId: user.user_id },
      })
      setShowDeleteRun(false)
      setActiveRun(null)
      await loadTestRuns()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to delete test run'
      setMessageRuns(reason)
    } finally {
      setStatus('idle')
    }
  }


  const updateStep = (index: number, field: 'description' | 'required_data', value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)))
  }

  const toggleRunCase = (id: number) => {
    setRunCaseIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const addStep = () => {
    setSteps((prev) => [...prev, { description: '', required_data: '' }])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  if (!user || !projectId) {
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

  const overLimit =
    titleInput.length > maxTitle ||
    descInput.length > maxDescription ||
    steps.some(
      (s) => s.description.length > maxStepDescription || (s.required_data || '').length > maxRequiredData,
    )

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={11} md={12}>
          <div className="page-header d-flex align-items-center justify-content-between">
            <div>
              <p className="eyebrow">Project #{projectId}</p>
              <h1>Project details</h1>
              <p className="subtitle">Manage test cases and runs for this project.</p>
            </div>
            <Button variant="link" className="text-muted p-0" onClick={() => navigate('/projects', { state: { user } })}>
              Back to projects
            </Button>
          </div>
          <Card className="glass-card shadow-sm">
            <Card.Body>
              <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab((k as any) || 'cases')}>
                <Nav.Item>
                  <Nav.Link eventKey="cases">Test cases</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="runs">
                    Test runs
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {activeTab === 'cases' && (
                <div className="d-grid gap-3 mt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Test cases</h5>
                    <Button variant="outline-light" className="soft-button" onClick={openCreate}>
                      + Create test case
                    </Button>
                  </div>

                  {status === 'error' && (
                    <Alert variant="danger" className="mb-0">
                      {message}
                    </Alert>
                  )}
                  {status === 'loading' && (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <Spinner animation="border" size="sm" />
                      <span>Loading test cases…</span>
                    </div>
                  )}

                  <ListGroup variant="flush" className="glass-list">
                    {testCases.length === 0 && status !== 'loading' ? (
                      <ListGroup.Item className="glass-list-item d-flex justify-content-between align-items-center">
                        <span className="text-muted">No test cases yet. Create one to get started.</span>
                        <Button size="sm" variant="outline-light" className="soft-button" onClick={openCreate}>
                          Create
                        </Button>
                      </ListGroup.Item>
                    ) : (
                      testCases.map((tc) => (
                        <ListGroup.Item
                          key={tc.test_case_id}
                          className="glass-list-item d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <div className="fw-semibold">{tc.title}</div>
                            <div className="text-muted small mb-0">
                              {tc.description || 'No description provided'}
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-light"
                              className="soft-button"
                              onClick={() => openEdit(tc)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => openDelete(tc)}
                            >
                              Delete
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>
                </div>
              )}

              {activeTab === 'runs' && (
                <div className="d-grid gap-3 mt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Test runs</h5>
                    <Button variant="outline-light" className="soft-button" onClick={openCreateRun}>
                      + Create test run
                    </Button>
                  </div>
                  {messageRuns && (
                    <Alert variant="danger" className="mb-0">
                      {messageRuns}
                    </Alert>
                  )}
                  <ListGroup variant="flush" className="glass-list">
                    {testRuns.length === 0 ? (
                      <ListGroup.Item className="glass-list-item d-flex justify-content-between align-items-center">
                        <span className="text-muted">No test runs yet. Create one to get started.</span>
                        <Button size="sm" variant="outline-light" className="soft-button" onClick={openCreateRun}>
                          Create
                        </Button>
                      </ListGroup.Item>
                    ) : (
                      testRuns.map((tr) => {
                        const summary = runSummaries[tr.test_run_id]
                        const total = summary?.total ?? 0
                        const completed =
                          summary?.byStatus.reduce((acc, s) => (s.name === 'UNSET' ? acc : acc + s.count), 0) ??
                          0
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
                        return (
                        <ListGroup.Item
                          key={tr.test_run_id}
                          className="glass-list-item d-flex align-items-center justify-content-between"
                        >
                          <div>
                            <div className="fw-semibold">{tr.name}</div>
                            <div className="text-muted small mb-0">
                              {tr.description || 'No description provided'} — Tester: {tr.tester_name} (ID: {tr.tester_id})
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
                              <span className="badge bg-secondary">
                                {completed}/{total || '0'} marked ({percent}%)
                              </span>
                              {summary?.byStatus
                                .filter((s) => s.name !== 'UNSET')
                                .map((s) => (
                                  <span
                                    key={s.name}
                                    className="badge"
                                    style={{
                                      background: s.color || 'rgba(255,255,255,0.1)',
                                      color: '#0b1224',
                                    }}
                                  >
                                    {s.name}: {s.count}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                navigate(`/test-runs/${tr.test_run_id}`, {
                                  state: { user, projectId, run: tr },
                                })
                              }
                            >
                              Run
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-light"
                              className="soft-button"
                              onClick={() => openEditRun(tr)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => openDeleteRun(tr)}
                            >
                              Delete
                            </Button>
                          </div>
                        </ListGroup.Item>
                        )
                      })
                    )}
                  </ListGroup>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create test case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="caseTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
              <div className="text-muted small mt-1">
                {titleInput.length}/{maxTitle}
              </div>
            </Form.Group>
            <Form.Group controlId="caseDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />
              <div className="text-muted small mt-1">
                {descInput.length}/{maxDescription}
              </div>
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Test steps</h6>
              <Button variant="outline-light" className="soft-button" size="sm" onClick={addStep}>
                + Add step
              </Button>
            </div>
            <div className="d-grid gap-3">
              {steps.map((step, index) => (
                <Card key={index} className="glass-card shadow-sm">
                  <Card.Body className="d-grid gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="fw-semibold">Step {index + 1}</div>
                      {steps.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Form.Group controlId={`stepDesc-${index}`}>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                      />
                      <div className="text-muted small mt-1">
                        {step.description.length}/{maxStepDescription}
                      </div>
                    </Form.Group>
                    <Form.Group controlId={`stepData-${index}`}>
                      <Form.Label>Required data (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        value={step.required_data || ''}
                        onChange={(e) => updateStep(index, 'required_data', e.target.value)}
                      />
                      <div className="text-muted small mt-1">
                        {(step.required_data || '').length}/{maxRequiredData}
                      </div>
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={
              !titleInput ||
              status === 'loading' ||
              overLimit ||
              steps.some((s) => s.description.trim().length === 0)
            }
          >
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit test case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="editCaseTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
              />
              <div className="text-muted small mt-1">
                {titleInput.length}/{maxTitle}
              </div>
            </Form.Group>
            <Form.Group controlId="editCaseDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />
              <div className="text-muted small mt-1">
                {descInput.length}/{maxDescription}
              </div>
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Test steps</h6>
              <Button variant="outline-light" className="soft-button" size="sm" onClick={addStep}>
                + Add step
              </Button>
            </div>
            <div className="d-grid gap-3">
              {steps.map((step, index) => (
                <Card key={index} className="glass-card shadow-sm">
                  <Card.Body className="d-grid gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="fw-semibold">Step {index + 1}</div>
                      {steps.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Form.Group controlId={`editStepDesc-${index}`}>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                      />
                      <div className="text-muted small mt-1">
                        {step.description.length}/{maxStepDescription}
                      </div>
                    </Form.Group>
                    <Form.Group controlId={`editStepData-${index}`}>
                      <Form.Label>Required data (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        value={step.required_data || ''}
                        onChange={(e) => updateStep(index, 'required_data', e.target.value)}
                      />
                      <div className="text-muted small mt-1">
                        {(step.required_data || '').length}/{maxRequiredData}
                      </div>
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEdit}
            disabled={
              !titleInput ||
              status === 'loading' ||
              overLimit ||
              steps.some((s) => s.description.trim().length === 0)
            }
          >
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete test case</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{activeCase?.title}</strong>? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={status === 'loading'}>
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCreateRun} onHide={() => setShowCreateRun(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create test run</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="runName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={runNameInput}
                onChange={(e) => setRunNameInput(e.target.value)}
              />
              <div className="text-muted small mt-1">{runNameInput.length}/150</div>
            </Form.Group>
            <Form.Group controlId="runDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={runDescInput}
                onChange={(e) => setRunDescInput(e.target.value)}
              />
              <div className="text-muted small mt-1">{runDescInput.length}/1000</div>
            </Form.Group>
            <Form.Group controlId="runTester">
              <Form.Label>Assign tester</Form.Label>
              <Form.Select
                value={runTesterId}
                onChange={(e) => setRunTesterId(Number(e.target.value))}
              >
                {orgUsers.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.user_name} ({u.role})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="runCases">
              <Form.Label>Test cases in this project</Form.Label>
              <div className="d-grid gap-2 checkbox-list">
                {testCases.map((tc) => {
                  const checked = runCaseIds.includes(tc.test_case_id)
                  return (
                    <div
                      key={tc.test_case_id}
                      className="form-check checkbox-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleRunCase(tc.test_case_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleRunCase(tc.test_case_id)
                        }
                      }}
                    >
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={checked}
                        readOnly
                        tabIndex={-1}
                      />
                      <label className="form-check-label" htmlFor="">
                        {tc.title}
                      </label>
                    </div>
                  )
                })}
              </div>
              <div className="text-muted small mt-1">
                Selected {runCaseIds.length} / {testCases.length || 'all'}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateRun(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateRun}
            disabled={
              !runNameInput ||
              !runTesterId ||
              runCaseIds.length === 0 ||
              status === 'loading' ||
              runNameInput.length > 150 ||
              runDescInput.length > 1000
            }
          >
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditRun} onHide={() => setShowEditRun(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit test run</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="editRunName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={runNameInput}
                onChange={(e) => setRunNameInput(e.target.value)}
              />
              <div className="text-muted small mt-1">{runNameInput.length}/150</div>
            </Form.Group>
            <Form.Group controlId="editRunDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={runDescInput}
                onChange={(e) => setRunDescInput(e.target.value)}
              />
              <div className="text-muted small mt-1">{runDescInput.length}/1000</div>
            </Form.Group>
            <Form.Group controlId="editRunTester">
              <Form.Label>Assign tester</Form.Label>
              <Form.Select
                value={runTesterId}
                onChange={(e) => setRunTesterId(Number(e.target.value))}
              >
                {orgUsers.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.user_name} ({u.role})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="editRunCases">
              <Form.Label>Test cases in this project</Form.Label>
              <div className="d-grid gap-2 checkbox-list">
                {testCases.map((tc) => {
                  const checked = runCaseIds.includes(tc.test_case_id)
                  return (
                    <div
                      key={tc.test_case_id}
                      className="form-check checkbox-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleRunCase(tc.test_case_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleRunCase(tc.test_case_id)
                        }
                      }}
                    >
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={checked}
                        readOnly
                        tabIndex={-1}
                      />
                      <label className="form-check-label" htmlFor="">
                        {tc.title}
                      </label>
                    </div>
                  )
                })}
              </div>
              <div className="text-muted small mt-1">
                Selected {runCaseIds.length} / {testCases.length || 'all'}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditRun(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditRun}
            disabled={
              !runNameInput ||
              !runTesterId ||
              runCaseIds.length === 0 ||
              status === 'loading' ||
              runNameInput.length > 150 ||
              runDescInput.length > 1000
            }
          >
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteRun} onHide={() => setShowDeleteRun(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete test run</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{activeRun?.name}</strong>? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteRun(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteRun} disabled={status === 'loading'}>
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  )
}

export default ProjectDetailsPage


