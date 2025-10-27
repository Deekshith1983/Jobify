import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/api';

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await applicationService.getMyApplications();
        setApplications(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch applications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <Badge bg="info">Applied</Badge>;
      case 'under_review':
        return <Badge bg="warning">Under Review</Badge>;
      case 'shortlisted':
        return <Badge bg="success">Shortlisted</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'hired':
        return <Badge bg="primary">Hired</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const filteredApplications = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeTab);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Applications</h2>

      <div className="mb-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <Button 
              variant={activeTab === 'all' ? 'primary' : 'light'}
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </Button>
          </li>
          <li className="nav-item">
            <Button 
              variant={activeTab === 'applied' ? 'primary' : 'light'}
              className={`nav-link ${activeTab === 'applied' ? 'active' : ''}`}
              onClick={() => setActiveTab('applied')}
            >
              Applied
            </Button>
          </li>
          <li className="nav-item">
            <Button 
              variant={activeTab === 'shortlisted' ? 'primary' : 'light'}
              className={`nav-link ${activeTab === 'shortlisted' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortlisted')}
            >
              Shortlisted
            </Button>
          </li>
          <li className="nav-item">
            <Button 
              variant={activeTab === 'rejected' ? 'primary' : 'light'}
              className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected
            </Button>
          </li>
        </ul>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-5">
          <p className="lead">No applications found in this category.</p>
          <Link to="/browse-jobs" className="btn btn-primary mt-3">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <Row>
          {filteredApplications.map(application => (
            <Col md={6} lg={4} className="mb-4" key={application.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <img 
                      src={application.company_logo} 
                      alt={application.company_name} 
                      className="me-3"
                      width="50"
                      height="50"
                    />
                    <div>
                      <h5 className="card-title mb-0">{application.job.title}</h5>
                      <p className="text-muted mb-0">{application.job.employer_name}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="mb-1">
                      <i className="bi bi-geo-alt me-2"></i>
                      {application.job.location_city}, {application.job.location_state}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-briefcase me-2"></i>
                      {application.job.job_type}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-calendar me-2"></i>
                      Applied on {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    {getStatusBadge(application.status)}
                  </div>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <div className="d-grid gap-2">
                    <Link 
                      to={`/job/${application.job.id}`} 
                      className="btn btn-outline-primary"
                    >
                      View Job
                    </Link>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyApplications;