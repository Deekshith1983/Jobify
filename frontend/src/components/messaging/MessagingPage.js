import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Spinner, Alert, Form, Button, InputGroup } from 'react-bootstrap';
import { messagingService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [socket, setSocket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await messagingService.getConversations();
        setConversations(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load conversations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    return () => {
      if (socket) {
        socket.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConversationSelect = async (convo) => {
    setSelectedConversation(convo);
    setSearchQuery('');
    setIsSearching(false);

    try {
      setMessagesLoading(true);
      const response = await messagingService.getMessages(convo.user.id);
      setMessages(response.data);
      setMessagesError(null);
    } catch (err) {
      setMessagesError('Failed to load messages.');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }

    if (socket) {
      socket.close();
    }

    // Use the token from localStorage, which is managed by the api service interceptor
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error("Authentication token not found.");
      setMessagesError("Authentication failed. Please log in again.");
      return;
    }

    const wsHost = 'localhost:8000';
    const newSocket = new WebSocket(
      `ws://${wsHost}/ws/chat/${convo.user.id}/?token=${token}`
    );

    newSocket.onopen = () => console.log('WebSocket connected');
    newSocket.onclose = () => console.log('WebSocket disconnected');
    newSocket.onerror = (error) => console.error('WebSocket error:', error);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages(prevMessages => [...prevMessages, data.message]);
      }
    };

    setSocket(newSocket);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 'message': newMessage }));
      setNewMessage('');

      const isNewConversation = !conversations.some(c => c.user.id === selectedConversation.user.id);
      if (isNewConversation) {
        setConversations(prev => [selectedConversation, ...prev]);
      }
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await messagingService.searchUsers(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <InputGroup>
                <Form.Control
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Card.Header>
            <ListGroup variant="flush" style={{ height: '550px', overflowY: 'auto' }}>
              {isSearching ? (
                searchResults.length > 0 ? (
                  searchResults.map(userResult => (
                    <ListGroup.Item key={userResult.id} action onClick={() => handleConversationSelect({ user: userResult })}>
                      {userResult.full_name || userResult.username}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>No users found.</ListGroup.Item>
                )
              ) : (
                <>
                  {loading && <Spinner animation="border" className="m-3" />}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {!loading && !error && conversations.length === 0 && (
                    <ListGroup.Item>No conversations yet.</ListGroup.Item>
                  )}
                  {!loading && !error && conversations.map(convo => (
                    <ListGroup.Item
                      key={convo.user.id}
                      action
                      active={selectedConversation?.user.id === convo.user.id}
                      onClick={() => handleConversationSelect(convo)}
                    >
                      {convo.user.full_name || convo.user.username}
                    </ListGroup.Item>
                  ))}
                </>
              )}
            </ListGroup>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Header>
              {selectedConversation ? `Chat with ${selectedConversation.user.full_name || selectedConversation.user.username}` : 'Select a conversation'}
            </Card.Header>
            <Card.Body style={{ height: '500px', overflowY: 'auto' }}>
              {messagesLoading ? (
                <Spinner animation="border" />
              ) : messagesError ? (
                <Alert variant="danger">{messagesError}</Alert>
              ) : selectedConversation ? (
                messages.length > 0 ? (
                  messages.map(msg => (
                    <div key={msg.id} className={`mb-2 d-flex ${msg.sender === user.id ? 'justify-content-end' : ''}`}>
                      <div className={`p-2 rounded ${msg.sender === user.id ? 'bg-primary text-white' : 'bg-light'}`}>
                        <strong>{msg.sender_name}:</strong> {msg.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No messages yet. Start the conversation!</p>
                )
              ) : (
                <p>Select a conversation to start chatting.</p>
              )}
              <div ref={messagesEndRef} />
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={handleSendMessage}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!selectedConversation || messagesLoading}
                  />
                  <Button variant="primary" type="submit" disabled={!selectedConversation || !newMessage.trim()}>
                    Send
                  </Button>
                </InputGroup>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MessagingPage;
