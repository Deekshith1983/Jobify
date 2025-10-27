import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/api';

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'Full-Time',
    skills_required: '',
    salary_min: '',
    salary_max: '',
    location_city: '',
    location_state: '',
    application_deadline: '',
    job_description_pdf: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      job_description_pdf: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();

    // Handle required fields
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('job_type', formData.job_type);
    data.append('skills_required', formData.skills_required);
    data.append('location_city', formData.location_city);
    data.append('location_state', formData.location_state);

    // Handle optional fields
    if (formData.application_deadline && formData.application_deadline !== '') {
      data.append('application_deadline', formData.application_deadline);
    }

    // Handle optional numeric fields - only append if not empty
    if (formData.salary_min && formData.salary_min !== '') {
      data.append('salary_min', formData.salary_min);
    }
    if (formData.salary_max && formData.salary_max !== '') {
      data.append('salary_max', formData.salary_max);
    }

    // Handle file upload
    if (formData.job_description_pdf) {
      data.append('job_description_pdf', formData.job_description_pdf);
    }

    try {
      await jobService.createJob(data);

      setSuccess(true);
      setLoading(false);

      // Reset form after successful submission
      setTimeout(() => {
        navigate('/employer/manage-jobs');
      }, 2000);
    } catch (err) {
      let errorMessage = 'Failed to post job. Please try again.';

      if (err.response?.data) {
        // Handle validation errors
        if (typeof err.response.data === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(err.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join('; ');
        } else {
          errorMessage = err.response.data;
        }
      }

      setError(errorMessage);
      console.error('Job post error:', err.response?.data);
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header as="h5" className="bg-primary text-white">
              Post a New Job
            </Card.Header>
            <Card.Body className="p-4">
              {success && (
                <Alert variant="success">
                  Job posted successfully! Redirecting to manage jobs...
                </Alert>
              )}

              {error && (
                <Alert variant="danger">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <h5 className="mb-4">Job Details</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Job Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior React Developer"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Brief Job Summary</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a brief summary of the job. The detailed description can be uploaded as a PDF below."
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Job Description (PDF)</Form.Label>
                  <Form.Control
                    type="file"
                    name="job_description_pdf"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Job Type</Form.Label>
                      <Form.Select
                        name="job_type"
                        value={formData.job_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="location_city"
                            value={formData.location_city}
                            onChange={handleInputChange}
                            placeholder="e.g. Bangalore"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="location_state"
                            value={formData.location_state}
                            onChange={handleInputChange}
                            placeholder="e.g. Karnataka"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Required Skills</Form.Label>
                  <Form.Control
                    type="text"
                    name="skills_required"
                    value={formData.skills_required}
                    onChange={handleInputChange}
                    placeholder="e.g. React, JavaScript, CSS"
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Minimum Salary (Optional)</Form.Label>
                      <Form.Control
                        type="number"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleInputChange}
                        placeholder="e.g. 1000000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Maximum Salary (Optional)</Form.Label>
                      <Form.Control
                        type="number"
                        name="salary_max"
                        value={formData.salary_max}
                        onChange={handleInputChange}
                        placeholder="e.g. 1500000"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Application Deadline (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleInputChange}
                  />
                </Form.Group>



                <div className="d-grid gap-2 mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Posting Job...
                      </>
                    ) : 'Post Job'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PostJob;