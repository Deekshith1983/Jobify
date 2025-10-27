import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessageContext';

const MessagingCenter = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    loading, 
    activeConversation, 
    setActiveConversation, 
    messages, 
    messagesLoading, 
    sendMessage, 
    refreshConversations 
  } = useMessages();
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');



  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const success = await sendMessage(activeConversation.id, newMessage);
      
      if (success) {
        // Clear input
        setNewMessage('');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv => 
    (conv.with_user.full_name && conv.with_user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.with_user.company_name && conv.with_user.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.job && conv.job.title && conv.job.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container className="py-5">
      <h2 className="mb-4">Messages</h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row>
        <Col md={4} className="mb-4 mb-md-0">
          <Card className="shadow-sm">
            <Card.Header>
              <Form.Control
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-0"
              />
            </Card.Header>
            <ListGroup variant="flush" className="conversation-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading && !activeConversation ? (
                <ListGroup.Item className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </ListGroup.Item>
              ) : filteredConversations.length === 0 ? (
                <ListGroup.Item className="text-center py-3">
                  No conversations found.
                </ListGroup.Item>
              ) : (
                filteredConversations.map(conversation => (
                  <ListGroup.Item 
                    key={conversation.id} 
                    action 
                    active={activeConversation?.id === conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    className="d-flex justify-content-between align-items-start py-3"
                  >
                    <div className="ms-2 me-auto">
                      <div className="fw-bold d-flex align-items-center">
                        {user?.role === 'job_seeker' ? conversation.with_user.company_name : conversation.with_user.full_name}
                        {conversation.unread_count > 0 && (
                          <Badge bg="primary" pill className="ms-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.job && (
                        <div className="text-muted small">Re: {conversation.job.title}</div>
                      )}
                      <div className="text-truncate" style={{ maxWidth: '200px' }}>
                        {conversation.last_message}
                      </div>
                    </div>
                    <small className="text-muted">
                      {formatDate(conversation.updated_at).split(' ')[0]}
                    </small>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm message-container" style={{ height: '650px' }}>
            {!activeConversation ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
                <i className="bi bi-chat-dots" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                <h5 className="mt-3">Select a conversation to start messaging</h5>
                <p className="text-muted">You can communicate with employers or job seekers about job opportunities.</p>
              </div>
            ) : (
              <>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">
                      {user?.role === 'job_seeker' ? activeConversation.with_user.company_name : activeConversation.with_user.full_name}
                    </h5>
                    {activeConversation.job && (
                      <small className="text-muted">Re: {activeConversation.job.title}</small>
                    )}
                  </div>
                </Card.Header>

                <div className="message-list p-3" style={{ height: '500px', overflowY: 'auto' }}>
                  {messagesLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-3 text-muted">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map(message => {
                      const isCurrentUser = message.sender_id === (user?.id || 1);
                      return (
                        <div 
                          key={message.id} 
                          className={`message mb-3 ${isCurrentUser ? 'text-end' : ''}`}
                        >
                          <div 
                            className={`message-bubble d-inline-block p-3 rounded ${isCurrentUser ? 'bg-primary text-white' : 'bg-light'}`}
                            style={{ maxWidth: '75%', textAlign: 'left' }}
                          >
                            {message.content}
                            <div className="message-time small mt-1">
                              <small className={isCurrentUser ? 'text-white-50' : 'text-muted'}>
                                {formatDate(message.timestamp)}
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <Card.Footer className="p-3">
                  <Form onSubmit={handleSendMessage}>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        required
                      />
                      <Button variant="primary" type="submit" className="ms-2">
                        Send
                      </Button>
                    </div>
                  </Form>
                </Card.Footer>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MessagingCenter;