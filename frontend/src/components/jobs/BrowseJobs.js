import React, { useState, useEffect, useCallback } from 'react';
import { jobService } from '../../services/api';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    jobType: '',
    salary: ''
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.searchJobs(filters);
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      jobType: '',
      salary: ''
    });
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Browse Jobs</h2>

      {/* Search and Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label>Keyword</Form.Label>
                  <Form.Control
                    type="text"
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleFilterChange}
                    placeholder="Job title, skills, etc."
                  />
                </Form.Group>
              </Col>
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="City, State"
                  />
                </Form.Group>
              </Col>
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label>Job Type</Form.Label>
                  <Form.Select
                    name="jobType"
                    value={filters.jobType}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label>Salary Range</Form.Label>
                  <Form.Select
                    name="salary"
                    value={filters.salary}
                    onChange={handleFilterChange}
                  >
                    <option value="">Any Salary</option>
                    <option value="0-500000">Up to ₹5 LPA</option>
                    <option value="500000-1000000">₹5 - ₹10 LPA</option>
                    <option value="1000000-2000000">₹10 - ₹20 LPA</option>
                    <option value="2000000+">Above ₹20 LPA</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="mt-3 d-flex justify-content-between">
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button type="submit" variant="primary">
                Search Jobs
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Job Listings */}
      {loading ? (
        <div className="text-center my-5">
          <p>Loading jobs...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center my-5">
          <h4>No Jobs Found</h4>
          <p>It looks like there are no jobs available at the moment. Employers can post jobs, and they will appear here for you to browse and apply.</p>
        </div>
      ) : (
        <Row>
          {jobs.map(job => {
            // Check if job deadline has passed
            const today = new Date().toISOString().split('T')[0];
            const isExpired = job.application_deadline < today;

            return (
              <Col md={6} lg={4} className="mb-4" key={job.id}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">
                        <Link to={`/job/${job.id}`} className="text-decoration-none">
                          {job.title}
                        </Link>
                      </h5>
                      <Badge bg={isExpired ? 'danger' : 'success'} pill>
                        {isExpired ? 'Expired' : 'Active'}
                      </Badge>
                    </div>
                    <h6 className="text-muted mb-3">{job.employer_profile?.company_name || 'N/A'}</h6>
                    <p className="mb-2">
                      <i className="bi bi-geo-alt me-2"></i>
                      {job.location_city}, {job.location_state}
                    </p>
                    <p className="mb-2">
                      <i className="bi bi-briefcase me-2"></i>
                      {job.job_type}
                    </p>
                    <p className="mb-2">
                      <i className="bi bi-currency-rupee me-2"></i>
                      {job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : 'Not Disclosed'}
                    </p>
                    <p className="mb-3">
                      <i className="bi bi-calendar me-2"></i>
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <Link to={`/job/${job.id}`} className="btn btn-outline-primary w-100">
                      View Details
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
};

export default BrowseJobs;