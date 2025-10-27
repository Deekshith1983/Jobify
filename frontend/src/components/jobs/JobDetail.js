import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobService } from '../../services/api';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await jobService.getJob(id);
        setJob(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <p>Loading job details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Job not found</div>
      </Container>
    );
  }

  // Check if job deadline has passed
  const today = new Date().toISOString().split('T')[0];
  const isExpired = job.application_deadline < today;

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="card-title mb-3">{job.title}</h3>

              <div className="mb-2">
                <Badge bg="primary" className="me-2">{job.job_type}</Badge>
                {isExpired ? (
                  <Badge bg="danger">Expired</Badge>
                ) : (
                  <Badge bg="success">Active</Badge>
                )}
              </div>

              <hr />

              <p><strong>Description:</strong></p>
              <p>{job.description}</p>

              <p><strong>Skills Required:</strong> {job.skills_required}</p>
              <p><strong>Salary:</strong> {job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : 'Not Disclosed'}</p>
              <p><strong>Location:</strong> {job.location_city}, {job.location_state}</p>
              <p><strong>Deadline:</strong> {new Date(job.application_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <p><strong>Posted On:</strong> {new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>

              <div className="mt-4 d-flex justify-content-between">
                <Link to="/browse-jobs" className="btn btn-secondary">
                  ← Back to Jobs
                </Link>
                {!isExpired && (
                  <Link to={`/job/${job.id}/apply`} className="btn btn-primary">
                    Apply Now
                  </Link>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default JobDetail;