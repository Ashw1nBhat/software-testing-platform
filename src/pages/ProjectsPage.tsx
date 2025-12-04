import { Card, Col, Container, Row } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

function ProjectsPage() {
  const location = useLocation()
  const user = (location.state as { user?: unknown } | undefined)?.user

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <div className="page-header d-flex align-items-center justify-content-between">
            <div>
              <p className="eyebrow">Projects</p>
              <h1>Your projects</h1>
              <p className="subtitle">Project list will appear here.</p>
            </div>
            <Link to="/login" className="text-muted">
              Log out
            </Link>
          </div>
          <Card className="glass-card shadow-sm">
            <Card.Body>
              <p className="mb-1 text-muted">
                {user ? 'No projects yet.' : 'No user session. Please log in again.'}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ProjectsPage
