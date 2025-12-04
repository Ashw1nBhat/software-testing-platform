import axios from 'axios'
import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap'
import { getDefaultDbConfig, type DbConfig } from './services/db'
import './App.css'

type ConnectionState = 'idle' | 'connecting' | 'success' | 'error'

function App() {
  const [config, setConfig] = useState<DbConfig>(getDefaultDbConfig)
  const [status, setStatus] = useState<ConnectionState>('idle')
  const [message, setMessage] = useState<string>('')
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:4000',
    [],
  )

  const handleFieldChange =
    (field: keyof DbConfig) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { value } = event.target

      if (field === 'port') {
        const parsed = value === '' ? undefined : Number(value)
        setConfig((prev) => ({ ...prev, port: parsed }))
        return
      }

      setConfig((prev) => ({ ...prev, [field]: value }))
    }

  const handleConnect = async (): Promise<void> => {
    setStatus('connecting')
    setMessage('')

    try {
      await axios.post(`${apiBase}/api/db/health`, config)
      setStatus('success')
      setMessage(
        'Connected successfully via the API server. You can now call stored procedures like create_user or login_user.',
      )
    } catch (error) {
      const isAxios = axios.isAxiosError(error)
      const reason =
        (isAxios && error.response?.data?.error) ||
        (isAxios && error.message) ||
        (error instanceof Error && error.message) ||
        'Unable to connect'
      setStatus('error')
      setMessage(reason)
    }
  }

  const isConnecting = status === 'connecting'

  return (
    <div className="app-shell">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            <div className="page-header">
              <p className="eyebrow">Testing Platform Database</p>
              <h1>Connect to MySQL</h1>
              <p className="subtitle">
                Provide your database credentials to connect through the local API server and use
                the stored procedures defined in <code>db/schema.sql</code>.
              </p>
            </div>

            <Card className="glass-card shadow-sm">
              <Card.Body>
                <Row className="g-3">
                  <Col md={7}>
                    <Form.Group controlId="dbHost">
                      <Form.Label>Host</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="127.0.0.1"
                        value={config.host}
                        onChange={handleFieldChange('host')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group controlId="dbPort">
                      <Form.Label>Port</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="3306"
                        value={config.port ?? ''}
                        onChange={handleFieldChange('port')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <Form.Group controlId="dbUser">
                      <Form.Label>User</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="db user"
                        value={config.user}
                        onChange={handleFieldChange('user')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="dbPassword">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="secret"
                        value={config.password}
                        onChange={handleFieldChange('password')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <Form.Group controlId="dbName">
                      <Form.Label>Database</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="testing_platform"
                        value={config.database}
                        onChange={handleFieldChange('database')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <div className="schema-hint">
                      <p className="mb-1 fw-semibold">Available procedures</p>
                      <p className="mb-0 text-muted small">
                        <code>create_user</code>, <code>login_user</code>
                      </p>
                      <p className="mb-0 text-muted small">
                        Tables: Organizations, Users, Projects, Test_Cases, Test_Steps, Test_Runs,
                        Test_Run_Cases, Statuses
                      </p>
                    </div>
                  </Col>
                </Row>

                <div className="d-flex align-items-center gap-3 mt-4">
                  <Button variant="primary" onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting && <Spinner animation="border" size="sm" className="me-2" />}
                    Test connection
                  </Button>
                  <span className="text-muted small">
                    Credentials also load from Vite env vars: VITE_DB_HOST, VITE_DB_PORT,
                    VITE_DB_USER, VITE_DB_PASSWORD, VITE_DB_NAME.
                  </span>
                </div>

                {status !== 'idle' && (
                  <Alert
                    variant={status === 'success' ? 'success' : 'danger'}
                    className="mt-4 mb-0"
                  >
                    <div className="d-flex align-items-center">
                      <strong className="me-2">
                        {status === 'success' ? 'Connected' : 'Connection failed'}
                      </strong>
                      <span>{message}</span>
                    </div>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default App
