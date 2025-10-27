import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    // Only fetch conversations if user is logged in
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Mock data - in a real app, this would be an API call
      const mockConversations = [
        {
          id: 1,
          with_user: {
            id: 101,
            username: 'johndoe',
            full_name: 'John Doe',
            role: user?.role === 'employer' ? 'job_seeker' : 'employer',
            company_name: user?.role === 'job_seeker' ? 'Tech Solutions Inc.' : null,
          },
          last_message: 'Thank you for your application. We would like to schedule an interview.',
          unread_count: 2,
          updated_at: '2023-07-15T10:30:00Z',
          job: user?.role === 'job_seeker' ? { id: 1, title: 'Frontend Developer' } : null
        },
        {
          id: 2,
          with_user: {
            id: 102,
            username: 'janedoe',
            full_name: 'Jane Doe',
            role: user?.role === 'employer' ? 'job_seeker' : 'employer',
            company_name: user?.role === 'job_seeker' ? 'Digital Innovations' : null,
          },
          last_message: 'I have a question about the job requirements.',
          unread_count: 0,
          updated_at: '2023-07-14T15:45:00Z',
          job: user?.role === 'job_seeker' ? { id: 2, title: 'Backend Developer' } : null
        },
      ];
      
      setConversations(mockConversations);
      setUnreadCount(mockConversations.reduce((total, conv) => total + conv.unread_count, 0));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      // Mock data - in a real app, this would be an API call
      const mockMessages = [
        {
          id: 1,
          sender_id: user?.id === 1 ? 1 : 101,
          recipient_id: user?.id === 1 ? 101 : 1,
          content: 'Hello, I saw your job posting for the Frontend Developer position.',
          timestamp: '2023-07-15T10:15:00Z',
          is_read: true
        },
        {
          id: 2,
          sender_id: user?.id === 1 ? 101 : 1,
          recipient_id: user?.id === 1 ? 1 : 101,
          content: 'Hi there! Thanks for your interest. Do you have any questions about the role?',
          timestamp: '2023-07-15T10:20:00Z',
          is_read: true
        },
        {
          id: 3,
          sender_id: user?.id === 1 ? 1 : 101,
          recipient_id: user?.id === 1 ? 101 : 1,
          content: 'Yes, I was wondering about the tech stack you use and if remote work is an option?',
          timestamp: '2023-07-15T10:25:00Z',
          is_read: true
        },
        {
          id: 4,
          sender_id: user?.id === 1 ? 101 : 1,
          recipient_id: user?.id === 1 ? 1 : 101,
          content: 'We use React, Node.js, and MongoDB. And yes, we offer hybrid work options with 2 days in office per week.',
          timestamp: '2023-07-15T10:30:00Z',
          is_read: false
        },
      ];
      
      setMessages(mockMessages);
      
      // Mark conversation as read
      markConversationAsRead(conversationId);
      
      setMessagesLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = (conversationId) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unread_count: 0 } 
        : conv
    );
    
    setConversations(updatedConversations);
    setUnreadCount(updatedConversations.reduce((total, conv) => total + conv.unread_count, 0));
  };

  const sendMessage = async (conversationId, content) => {
    try {
      // In a real app, this would be an API call
      const newMessage = {
        id: messages.length + 1,
        sender_id: user?.id || 1,
        recipient_id: activeConversation.with_user.id,
        content,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      
      // Add new message to the list
      setMessages(prev => [...prev, newMessage]);
      
      // Update last message in conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              last_message: content,
              updated_at: new Date().toISOString()
            } 
          : conv
      );
      
      setConversations(updatedConversations);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const startNewConversation = async (recipientId, initialMessage, jobId = null) => {
    try {
      // In a real app, this would be an API call to create a new conversation
      // and send the initial message
      
      // For now, we'll just add a mock conversation to the list
      const newConversation = {
        id: conversations.length + 1,
        with_user: {
          id: recipientId,
          username: 'newuser',
          full_name: 'New User',
          role: user?.role === 'employer' ? 'job_seeker' : 'employer',
          company_name: user?.role === 'job_seeker' ? 'New Company' : null,
        },
        last_message: initialMessage,
        unread_count: 0,
        updated_at: new Date().toISOString(),
        job: jobId ? { id: jobId, title: 'Job Title' } : null
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      
      // Add the initial message
      const newMessage = {
        id: 1,
        sender_id: user?.id || 1,
        recipient_id: recipientId,
        content: initialMessage,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      
      setMessages([newMessage]);
      
      return true;
    } catch (error) {
      console.error('Error starting new conversation:', error);
      return false;
    }
  };

  const value = {
    conversations,
    unreadCount,
    loading,
    activeConversation,
    setActiveConversation,
    messages,
    messagesLoading,
    sendMessage,
    startNewConversation,
    refreshConversations: fetchConversations
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};