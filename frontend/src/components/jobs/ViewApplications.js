import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Breadcrumb, Table, Button } from 'react-bootstrap';
import { useParams,Link } from 'react-router-dom';
import { applicationService, jobService } from '../../services/api';
import ApplicationDetailsModal from './ApplicationDetailsModal';

const ViewApplications = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchJobAndApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobData, applicationsData] = await Promise.all([
          jobService.getJob(jobId),
          applicationService.getApplicationsForJob(jobId),
        ]);
        setJob(jobData);
        setApplications(applicationsData);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      }
      setLoading(false);
    };

    fetchJobAndApplications();
  }, [jobId]);

      const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error("Failed to update application status", error);
      setError('Failed to update application status. Please try again.');
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleDownloadResume = async (applicationId, applicantName) => {
    try {
      const blob = await applicationService.downloadResume(applicationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume-${applicantName.replace(/ /g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download resume');
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error && !job) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/employer/manage-jobs" className="btn btn-secondary">
          Back to Manage Jobs
        </Link>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/employer/dashboard" }}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/employer/manage-jobs" }}>Manage Jobs</Breadcrumb.Item>
        <Breadcrumb.Item active>Applications</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Applications for {job?.title}</h2>
        <Link to="/employer/manage-jobs" className="btn btn-outline-secondary">
          Back to Jobs
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {applications.length === 0 ? (
        <Alert variant="info">No applications have been received for this job yet.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Applicant Name</th>
              <th>Applied On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={app.id}>
                <td>{index + 1}</td>
                <td>{app.applicant_name}</td>
                <td>{new Date(app.created_at).toLocaleDateString()}</td>
                <td><span className={`badge bg-${app.status === 'shortlisted' ? 'success' : app.status === 'rejected' ? 'danger' : 'secondary'}`}>{app.status}</span></td>
                <td>
                                    <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleViewDetails(app)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                    disabled={app.status === 'shortlisted' || app.status === 'rejected'}
                  >
                    Shortlist
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="me-2"
                    onClick={() => handleUpdateStatus(app.id, 'rejected')}
                    disabled={app.status === 'rejected'}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownloadResume(app.id, app.applicant_name)}
                  >
                    Download Resume
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ApplicationDetailsModal
        application={selectedApplication}
        show={showModal}
        onHide={() => setShowModal(false)}
      />
    </Container>
  );
};

export default ViewApplications;