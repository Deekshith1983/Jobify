import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="mb-4 mb-md-0">
              <h1 className="display-4 fw-bold">Find Your Dream Job</h1>
              <p className="lead mb-4">
                Connect with top employers and discover opportunities that match your skills and career goals.
              </p>
              {user ? (
                <Link 
                  to={user.role === 'job_seeker' ? '/browse-jobs' : '/employer/dashboard'} 
                  className="btn btn-light btn-lg"
                >
                  {user.role === 'job_seeker' ? 'Browse Jobs' : 'Go to Dashboard'}
                </Link>
              ) : (
                <div>
                  <Link to="/register" className="btn btn-light btn-lg me-3">
                    Sign Up
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg">
                    Login
                  </Link>
                </div>
              )}
            </Col>
            <Col md={6}>
              {/* Hero image or illustration can go here */}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Why Jobify?</h2>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-search text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <Card.Title>Find Relevant Jobs</Card.Title>
                <Card.Text>
                  Our advanced search algorithm helps you discover jobs that match your skills, experience, and preferences.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-building text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <Card.Title>Connect with Top Employers</Card.Title>
                <Card.Text>
                  Get access to opportunities from leading companies across various industries and locations.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-graph-up text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <Card.Title>Grow Your Career</Card.Title>
                <Card.Text>
                  Access resources, tips, and tools to help you advance in your professional journey.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Featured Jobs Section */}
      <div className="bg-light py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured Jobs</h2>
            <Link to="/browse-jobs" className="btn btn-outline-primary">
              View All Jobs
            </Link>
          </div>
          <Row>
            {/* Mock featured jobs - in a real app, these would come from an API */}
            {[
              {
                id: 1,
                title: 'Senior React Developer',
                company: 'Tech Solutions Inc.',
                location: 'Bangalore, Karnataka',
                salary: '₹15,00,000 - ₹20,00,000 per annum'
              },
              {
                id: 2,
                title: 'UX Designer',
                company: 'Creative Designs Ltd.',
                location: 'Mumbai, Maharashtra',
                salary: '₹10,00,000 - ₹15,00,000 per annum'
              },
              {
                id: 3,
                title: 'DevOps Engineer',
                company: 'Cloud Systems',
                location: 'Pune, Maharashtra',
                salary: '₹18,00,000 - ₹25,00,000 per annum'
              }
            ].map(job => (
              <Col md={4} className="mb-4" key={job.id}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5 className="card-title">{job.title}</h5>
                    <h6 className="text-muted mb-3">{job.company}</h6>
                    <p className="mb-2">
                      <i className="bi bi-geo-alt me-2"></i>
                      {job.location}
                    </p>
                    <p className="mb-3">
                      <i className="bi bi-currency-rupee me-2"></i>
                      {job.salary}
                    </p>
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <Link to={`/job/${job.id}`} className="btn btn-outline-primary w-100">
                      View Details
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* Call to Action */}
      <Container className="py-5 text-center">
        <h2 className="mb-4">Ready to Take the Next Step in Your Career?</h2>
        <p className="lead mb-4">
          Join thousands of job seekers who have found their dream jobs through our platform.
        </p>
        {!user && (
          <Button as={Link} to="/register" size="lg" variant="primary">
            Create Your Account
          </Button>
        )}
      </Container>
    </div>
  );
};

export default Home;