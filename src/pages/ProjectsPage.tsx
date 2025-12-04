import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Modal,
  Nav,
  Row,
  Spinner,
} from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'

type Project = { project_id: number; name: string; description: string | null }
type Status = 'idle' | 'loading' | 'error'
type StatusEntry = { status_name: string; color_hex: string }

function ProjectsPage() {
  const maxName = 150
  const maxDescription = 1000
  const location = useLocation()
  const navigate = useNavigate()
  const user = (location.state as { user?: { user_id: number; organization_id: number } } | undefined)
    ?.user
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000',
    [],
  )

  const [projects, setProjects] = useState<Project[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'projects' | 'statuses'>('projects')
  const [statuses, setStatuses] = useState<StatusEntry[]>([])
  const [statusesLoading, setStatusesLoading] = useState(false)
  const [messageStatuses, setMessageStatuses] = useState('')
  const [showCreateStatus, setShowCreateStatus] = useState(false)
  const [showEditStatus, setShowEditStatus] = useState(false)
  const [showDeleteStatus, setShowDeleteStatus] = useState(false)
  const [statusNameInput, setStatusNameInput] = useState('')
  const [statusColorInput, setStatusColorInput] = useState('#22c55e')
  const [activeStatus, setActiveStatus] = useState<StatusEntry | null>(null)
  const statusPalette = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7']
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [descInput, setDescInput] = useState('')

  const loadProjects = async () => {
    if (!user) return
    setStatus('loading')
    setMessage('')
    try {
      const response = await axios.get(`${apiBase}/api/projects`, {
        params: { userId: user.user_id },
      })
      if (response.data?.projects) {
        setProjects(response.data.projects)
      } else {
        setProjects([])
      }
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load projects'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  useEffect(() => {
    loadProjects()
    loadStatuses()
  }, [user])

  const loadStatuses = async () => {
    if (!user) return
    setStatusesLoading(true)
    setMessageStatuses('')
    try {
      const response = await axios.get(`${apiBase}/api/statuses`, { params: { userId: user.user_id } })
      setStatuses(response.data?.statuses || [])
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to load statuses'
      setMessageStatuses(reason)
    } finally {
      setStatusesLoading(false)
    }
  }

  const resetForm = () => {
    setNameInput('')
    setDescInput('')
  }

  const handleCreate = async () => {
    if (!user || !nameInput || nameInput.length > maxName || descInput.length > maxDescription) return
    setStatus('loading')
    setMessage('')
    try {
      await axios.post(`${apiBase}/api/projects`, {
        userId: user.user_id,
        name: nameInput,
        description: descInput,
      })
      setShowCreate(false)
      resetForm()
      await loadProjects()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to create project'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleEdit = async () => {
    if (
      !user ||
      !activeProject ||
      !nameInput ||
      nameInput.length > maxName ||
      descInput.length > maxDescription
    )
      return
    setStatus('loading')
    setMessage('')
    try {
      await axios.put(`${apiBase}/api/projects/${activeProject.project_id}`, {
        userId: user.user_id,
        name: nameInput,
        description: descInput,
      })
      setShowEdit(false)
      setActiveProject(null)
      resetForm()
      await loadProjects()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to update project'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleDelete = async () => {
    if (!user || !activeProject) return
    setStatus('loading')
    setMessage('')
    try {
      await axios.delete(`${apiBase}/api/projects/${activeProject.project_id}`, {
        data: { userId: user.user_id },
      })
      setShowDelete(false)
      setActiveProject(null)
      await loadProjects()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to delete project'
      setStatus('error')
      setMessage(reason)
    } finally {
      setStatus('idle')
    }
  }

  const handleCreateStatus = async () => {
    if (!user || !statusNameInput || !statusColorInput) return
    setStatusesLoading(true)
    setMessageStatuses('')
    try {
      await axios.post(`${apiBase}/api/statuses`, {
        userId: user.user_id,
        name: statusNameInput,
        colorHex: statusColorInput,
      })
      setShowCreateStatus(false)
      setStatusNameInput('')
      setStatusColorInput(statusPalette[0])
      await loadStatuses()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to create status'
      setMessageStatuses(reason)
    } finally {
      setStatusesLoading(false)
    }
  }

  const handleEditStatus = async () => {
    if (!user || !activeStatus || !statusColorInput) return
    setStatusesLoading(true)
    setMessageStatuses('')
    try {
      await axios.put(`${apiBase}/api/statuses/${activeStatus.status_name}`, {
        userId: user.user_id,
        colorHex: statusColorInput,
      })
      setShowEditStatus(false)
      setActiveStatus(null)
      setStatusNameInput('')
      setStatusColorInput(statusPalette[0])
      await loadStatuses()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to update status'
      setMessageStatuses(reason)
    } finally {
      setStatusesLoading(false)
    }
  }

  const handleDeleteStatus = async () => {
    if (!user || !activeStatus) return
    setStatusesLoading(true)
    setMessageStatuses('')
    try {
      await axios.delete(`${apiBase}/api/statuses/${activeStatus.status_name}`, {
        data: { userId: user.user_id },
      })
      setShowDeleteStatus(false)
      setActiveStatus(null)
      await loadStatuses()
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to delete status'
      setMessageStatuses(reason)
    } finally {
      setStatusesLoading(false)
    }
  }

  const openCreate = () => {
    resetForm()
    setShowCreate(true)
  }

  const openEdit = (project: Project) => {
    setActiveProject(project)
    setNameInput(project.name)
    setDescInput(project.description || '')
    setShowEdit(true)
  }

  const openDelete = (project: Project) => {
    setActiveProject(project)
    setShowDelete(true)
  }

  if (!user) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            <Card className="glass-card shadow-sm">
              <Card.Body className="d-flex flex-column gap-3">
                <h4 className="mb-0">Session expired</h4>
                <p className="text-muted mb-0">Please log in again to see your projects.</p>
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
              <p className="eyebrow">Projects</p>
              <h1>Your workspace</h1>
              <p className="subtitle">Manage projects and statuses in your organization.</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Button variant="link" className="text-muted p-0" onClick={() => navigate('/login')}>
                Log out
              </Button>
            </div>
          </div>
          <Card className="glass-card shadow-sm">
            <Card.Body className="d-grid gap-3">
              <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab((k as any) || 'projects')}>
                <Nav.Item>
                  <Nav.Link eventKey="projects">Projects</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="statuses">Statuses</Nav.Link>
                </Nav.Item>
              </Nav>

              {activeTab === 'projects' && (
                <div className="d-grid gap-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0">Projects</h5>
                    <Button variant="outline-light" className="soft-button" onClick={openCreate}>
                      + Create project
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
                      <span>Loading projects…</span>
                    </div>
                  )}
                  <ListGroup variant="flush" className="glass-list">
                    {projects.length === 0 && status !== 'loading' ? (
                      <ListGroup.Item className="glass-list-item d-flex justify-content-between align-items-center">
                        <span className="text-muted">No projects yet. Create your first project.</span>
                        <Button size="sm" variant="outline-light" className="soft-button" onClick={openCreate}>
                          Create
                        </Button>
                      </ListGroup.Item>
                    ) : (
                      projects.map((project) => (
                        <ListGroup.Item
                          key={project.project_id}
                          className="glass-list-item d-flex align-items-center justify-content-between"
                          action
                          onClick={() => navigate(`/projects/${project.project_id}`, { state: { user } })}
                        >
                          <div>
                            <div className="fw-semibold">{project.name}</div>
                            <div className="text-muted small mb-0">
                              {project.description || 'No description provided'}
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-light"
                              className="soft-button"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(project)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDelete(project)
                              }}
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

              {activeTab === 'statuses' && (
                <div className="d-grid gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Statuses</h5>
                    <Button
                      variant="outline-light"
                      className="soft-button"
                      onClick={() => {
                        setStatusNameInput('')
                        setStatusColorInput(statusPalette[0])
                        setShowCreateStatus(true)
                      }}
                    >
                      + Create status
                    </Button>
                  </div>
                  {messageStatuses && (
                    <Alert variant="danger" className="mb-0">
                      {messageStatuses}
                    </Alert>
                  )}
                  <ListGroup variant="flush" className="glass-list">
                    {statusesLoading ? (
                      <ListGroup.Item className="glass-list-item d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" />
                        <span className="text-muted">Loading statuses…</span>
                      </ListGroup.Item>
                    ) : statuses.length === 0 ? (
                      <ListGroup.Item className="glass-list-item d-flex justify-content-between align-items-center">
                        <span className="text-muted">No statuses yet. Create one to get started.</span>
                        <Button
                          size="sm"
                          variant="outline-light"
                          className="soft-button"
                          onClick={() => {
                            setStatusNameInput('')
                            setStatusColorInput(statusPalette[0])
                            setShowCreateStatus(true)
                          }}
                        >
                          Create
                        </Button>
                      </ListGroup.Item>
                    ) : (
                      statuses.map((st) => (
                        <ListGroup.Item
                          key={st.status_name}
                          className="glass-list-item d-flex align-items-center justify-content-between"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span className="color-dot" style={{ background: st.color_hex }} />
                            <div className="fw-semibold">{st.status_name}</div>
                            <span className="text-muted small">{st.color_hex}</span>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-light"
                              className="soft-button"
                              onClick={() => {
                                setActiveStatus(st)
                                setStatusNameInput(st.status_name)
                                setStatusColorInput(st.color_hex)
                                setShowEditStatus(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                setActiveStatus(st)
                                setShowDeleteStatus(true)
                              }}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="projectName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <div className="text-muted small mt-1">
                {nameInput.length}/{maxName}
              </div>
            </Form.Group>
            <Form.Group controlId="projectDescription">
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
              !nameInput ||
              status === 'loading' ||
              nameInput.length > maxName ||
              descInput.length > maxDescription
            }
          >
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="editProjectName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <div className="text-muted small mt-1">
                {nameInput.length}/{maxName}
              </div>
            </Form.Group>
            <Form.Group controlId="editProjectDescription">
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
              !nameInput ||
              status === 'loading' ||
              nameInput.length > maxName ||
              descInput.length > maxDescription
            }
          >
            {status === 'loading' && <Spinner animation="border" size="sm" className="me-2" />}
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{activeProject?.name}</strong>? This cannot be undone.
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

      <Modal show={showCreateStatus} onHide={() => setShowCreateStatus(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="statusName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={statusNameInput}
                onChange={(e) => setStatusNameInput(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Color</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {statusPalette.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline-light"
                    className={`color-pick ${statusColorInput === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setStatusColorInput(color)}
                  />
                ))}
              </div>
              <div className="text-muted small mt-1">{statusColorInput}</div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateStatus(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateStatus}
            disabled={statusesLoading || !statusNameInput || !statusColorInput}
          >
            {statusesLoading && <Spinner animation="border" size="sm" className="me-2" />}
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditStatus} onHide={() => setShowEditStatus(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group controlId="statusNameEdit">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={statusNameInput} readOnly />
            </Form.Group>
            <Form.Group>
              <Form.Label>Color</Form.Label>
              <div className="d-flex gap-2 flex-wrap">
                {statusPalette.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant="outline-light"
                    className={`color-pick ${statusColorInput === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setStatusColorInput(color)}
                  />
                ))}
              </div>
              <div className="text-muted small mt-1">{statusColorInput}</div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditStatus(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditStatus}
            disabled={statusesLoading || !statusColorInput}
          >
            {statusesLoading && <Spinner animation="border" size="sm" className="me-2" />}
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteStatus} onHide={() => setShowDeleteStatus(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{activeStatus?.status_name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteStatus(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteStatus} disabled={statusesLoading}>
            {statusesLoading && <Spinner animation="border" size="sm" className="me-2" />}
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ProjectsPage
