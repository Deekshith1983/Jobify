import React from 'react';
import { Modal, Button, Row, Col, Card } from 'react-bootstrap';

const ApplicationDetailsModal = ({ application, show, onHide }) => {
  if (!application) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Application Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5>Applicant Information</h5>
                <p><strong>Name:</strong> {application.applicant_name}</p>
                <p><strong>Email:</strong> {application.applicant_email}</p>
                <p><strong>Portfolio:</strong> <a href={application.portfolio_link} target="_blank" rel="noopener noreferrer">{application.portfolio_link}</a></p>
              </Col>
              <Col md={6}>
                <h5>Education</h5>
                <p><strong>Level:</strong> {application.education_level}</p>
                <p><strong>University:</strong> {application.university}</p>
                <p><strong>Major:</strong> {application.major}</p>
                <p><strong>GPA:</strong> {application.gpa}</p>
              </Col>
            </Row>
            <hr />
            <h5>Cover Letter</h5>
            <p style={{ whiteSpace: 'pre-wrap' }}>{application.cover_letter}</p>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApplicationDetailsModal;
