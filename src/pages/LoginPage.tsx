import axios from 'axios'
import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

type Status = 'idle' | 'loading' | 'error'

const friendlyError = (error: unknown) => {
  const msg = axios.isAxiosError(error)
    ? error.response?.data?.error || error.message
    : error instanceof Error
    ? error.message
    : ''
  if (msg) {
    const lower = msg.toLowerCase()
    if (lower.includes('invalid credentials')) return 'Invalid credentials'
    if (lower.includes('user not found')) return 'User does not exist'
    if (lower.includes('duplicate') || lower.includes('already exists')) return 'User already exists'
  }
  return 'Unexpected error occurred'
}

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000',
    [],
  )
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await axios.post(`${apiBase}/api/auth/login`, {
        username,
        password,
      })
      if (response.data?.ok) {
        navigate('/projects', { state: { user: response.data.user } })
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

  const disabled = status === 'loading' || !username || !password

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={6} md={8}>
          <div className="page-header">
            <p className="eyebrow">Testing Platform</p>
            <h1>Sign in</h1>
            <p className="subtitle">Use your username and password to access projects.</p>
          </div>
          <Card className="glass-card shadow-sm">
            <Card.Body>
              <Form onSubmit={handleSubmit} className="d-grid gap-3">
                <Form.Group controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={status === 'loading'}
                  />
                </Form.Group>
                <Form.Group controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'loading'}
                  />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary" disabled={disabled}>
                    {status === 'loading' && (
                      <Spinner animation="border" size="sm" className="me-2" />
                    )}
                    Log in
                  </Button>
                  <Button variant="outline-light" className="soft-button" onClick={() => navigate('/create-user')}>
                    Create a new user
                  </Button>
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
  )
}

export default LoginPage
