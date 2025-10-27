import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { jobService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ManageJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Full-time',
    skills: '',
    salary: '',
    location: '',
    deadline: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await jobService.getEmployerJobs();
        setJobs(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch jobs');
      }
      setLoading(false);
    };

    fetchJobs();
  }, []);

  const handleEditJob = (job) => {
    setCurrentJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      type: job.type,
      skills: job.skills,
      salary: job.salary,
      location: job.location,
      deadline: job.deadline,
      status: job.status
    });
    setShowEditModal(true);
  };

  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await jobService.deleteJob(jobToDelete.id);
      setJobs(jobs.filter(job => job.id !== jobToDelete.id));
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentJob) return;

    try {
      const updatedJob = await jobService.updateJob(currentJob.id, formData);
      setJobs(jobs.map(job => (job.id === currentJob.id ? updatedJob : job)));
      setShowEditModal(false);
      setCurrentJob(null);
    } catch (err) {
      setError(err.message || 'Failed to update job');
    }
  };

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Jobs</h2>
        <Link to="/employer/post-job" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i> Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-5">
          <h4>No Jobs Found</h4>
          <p>You have not posted any jobs yet. Get started by posting a job.</p>
          <Link to="/employer/post-job" className="btn btn-primary mt-3">
            Post a New Job
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Location</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Posted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <Link to={`/job/${job.id}`} className="text-decoration-none">
                      {job.title}
                    </Link>
                  </td>
                  <td>{job.type}</td>
                  <td>{job.location}</td>
                  <td>
                    <Link to={`/employer/jobs/${job.id}/applications`} className="btn btn-sm btn-info me-2">
                      View ({job.application_count})
                    </Link>
                  </td>
                  <td>
                    <Badge bg={job.status === 'active' ? 'success' : 'secondary'}>
                      {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'No Status'}
                    </Badge>
                  </td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEditJob(job)}
                      >
                        <i className="bi bi-pencil me-1"></i> Update
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteJob(job)}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Edit Job Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                required 
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Type</Form.Label>
                  <Form.Select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Required Skills</Form.Label>
              <Form.Control 
                type="text" 
                name="skills" 
                value={formData.skills} 
                onChange={handleInputChange} 
                placeholder="e.g. React, JavaScript, CSS" 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Salary Range</Form.Label>
              <Form.Control 
                type="text" 
                name="salary" 
                value={formData.salary} 
                onChange={handleInputChange} 
                placeholder="e.g. ₹10,00,000 - ₹15,00,000 per annum" 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleInputChange} 
                placeholder="e.g. Bangalore, Karnataka" 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Application Deadline</Form.Label>
              <Form.Control 
                type="date" 
                name="deadline" 
                value={formData.deadline} 
                onChange={handleInputChange} 
                required 
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the job: <strong>{jobToDelete?.title}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteJob}>
            Delete Job
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageJobs;