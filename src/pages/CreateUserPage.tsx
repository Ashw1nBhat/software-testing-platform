import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

type Status = 'idle' | 'loading' | 'error'

const friendlyError = (error: unknown) => {
  const msg = axios.isAxiosError(error)
    ? error.response?.data?.error || error.message
    : error instanceof Error
    ? error.message
    : ''
  if (msg) {
    const lower = msg.toLowerCase()
    if (lower.includes('user not found')) return 'User does not exist'
    if (lower.includes('duplicate') || lower.includes('already exists')) return 'User already exists'
  }
  return 'Unexpected error occurred'
}

function CreateUserPage() {
  const maxUsername = 150
  const maxEmployeeCode = 50
  const maxDesignation = 100
  const maxPassword = 255
  const [username, setUsername] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [designation, setDesignation] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000',
    [],
  )
  const navigate = useNavigate()
  const organizationId = useMemo(() => Number(import.meta.env.VITE_DEFAULT_ORG_ID || 1), [])

  useEffect(() => {
    let cancelled = false
    const loadRoles = async () => {
      try {
        const response = await axios.get(`${apiBase}/api/auth/roles`)
        if (!cancelled && response.data?.roles) {
          setRoles(response.data.roles)
          if (!role && response.data.roles.length > 0) {
            setRole(response.data.roles[0])
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(friendlyError(error))
          setStatus('error')
        }
      }
    }
    loadRoles()
    return () => {
      cancelled = true
    }
  }, [apiBase])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await axios.post(`${apiBase}/api/auth/create`, {
        username,
        employeeCode,
        designation,
        role,
        password,
        organizationId,
      })
      if (response.data?.ok) {
        setShowSuccess(true)
        setUsername('')
        setEmployeeCode('')
        setDesignation('')
        setPassword('')
      } else {
        setStatus('error')
        setMessage('Unexpected error occurred')
      }
    } catch (error) {
      setStatus('error')
      setMessage(friendlyError(error))
    } finally {
      setStatus((prev) => (prev === 'loading' ? 'idle' : prev))
    }
  }

  const overLimit =
    username.length > maxUsername ||
    employeeCode.length > maxEmployeeCode ||
    designation.length > maxDesignation ||
    password.length > maxPassword

  const disabled =
    status === 'loading' || !username || !employeeCode || !role || !password || overLimit

  return (
    <>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={7} md={9}>
            <div className="page-header">
              <p className="eyebrow">Testing Platform</p>
              <h1>Create user</h1>
            </div>
            <Card className="glass-card shadow-sm">
              <Card.Body>
                <Form onSubmit={handleSubmit} className="d-grid gap-3">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="username">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={status === 'loading'}
                        />
                        <div className="text-muted small mt-1">
                          {username.length}/{maxUsername}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="employeeCode">
                        <Form.Label>Employee code</Form.Label>
                        <Form.Control
                          type="text"
                          value={employeeCode}
                          onChange={(e) => setEmployeeCode(e.target.value)}
                          disabled={status === 'loading'}
                        />
                        <div className="text-muted small mt-1">
                          {employeeCode.length}/{maxEmployeeCode}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="designation">
                        <Form.Label>Designation</Form.Label>
                        <Form.Control
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          disabled={status === 'loading'}
                        />
                        <div className="text-muted small mt-1">
                          {designation.length}/{maxDesignation}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="role">
                        <Form.Label>Role</Form.Label>
                        <Form.Select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          disabled={status === 'loading' || roles.length === 0}
                        >
                          {roles.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={status === 'loading'}
                        />
                        <div className="text-muted small mt-1">
                          {password.length}/{maxPassword}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex align-items-center gap-3">
                    <Button type="submit" variant="primary" disabled={disabled}>
                      {status === 'loading' && (
                        <Spinner animation="border" size="sm" className="me-2" />
                      )}
                      Create user
                    </Button>
                    {!showSuccess && (
                      <Link to="/login" className="back-link">
                        Back to login
                      </Link>
                    )}
                  </div>
                  {status === 'error' && (
                    <Alert variant="danger" className="mb-0">
                      {message}
                    </Alert>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showSuccess} onHide={() => setShowSuccess(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>User created</Modal.Title>
        </Modal.Header>
        <Modal.Body>Your account has been created. Please log in to continue.</Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccess(false)
              navigate('/login')
            }}
          >
            Go to login
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default CreateUserPage
