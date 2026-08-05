import { useEffect, useRef, useState } from 'react';
import {
  createChat,
  createUser,
  deleteChat,
  listMessages,
  listUserChats,
  sendChatMessage,
  updateMessageFeedback,
  loginUser,
  deleteUser,
  updateChatTitle,
} from '../api/claraApi';

export function useClaraChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clara_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  const [newChatTitle, setNewChatTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const chatBoxRef = useRef(null);

  const setAuthModeAndClearStatus = (mode) => {
    setAuthMode(mode);
    setStatusMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('clara_user', JSON.stringify(user));
      loadChats(user.id);
    } else {
      localStorage.removeItem('clara_user');
    }
  }, [user]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsAuthLoading(true);
    setStatusMessage('');
    try {
      const loggedInUser = await loginUser(email.trim(), password.trim());
      setUser(loggedInUser);
      setEmail('');
      setPassword('');
      setStatusMessage(`Welcome back, ${loggedInUser.first_name || loggedInUser.name}!`);
      await loadChats(loggedInUser.id);
    } catch (error) {
      setStatusMessage(error.message || 'Invalid email or password.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !dateOfBirth) return;
    
    if (password.length < 8) {
      setStatusMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage('Passwords do not match. Please re-confirm password.');
      return;
    }

    setIsAuthLoading(true);
    setStatusMessage('');
    try {
      await createUser(
        firstName.trim(), 
        lastName.trim(), 
        email.trim(), 
        password.trim(), 
        dateOfBirth 
      );
      
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDateOfBirth('');
      
      setAuthMode('login');
      setStatusMessage('Account successfully created! Please enter your credentials to log in.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to create account.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    localStorage.removeItem('clara_user');
    setAuthMode('login');
    setStatusMessage('Successfully logged out.');
  };

  const handleDeleteAccount = async (userId) => {
    try {
      await deleteUser(userId);
      setUser(null);
      setChats([]);
      setMessages([]);
      setActiveChatId(null);
      localStorage.removeItem('clara_user');
      setAuthMode('login');
      setStatusMessage('Your account has been successfully deleted.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to delete account.');
    }
  };

  const loadChats = async (currentUserId) => {
    try {
      const nextChats = await listUserChats(currentUserId);
      setChats(nextChats);
      setActiveChatId((current) => current || nextChats[0]?.id || null);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to load chats.');
    }
  };

  const loadMessages = async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    try {
      const nextMessages = await listMessages(chatId);
      const uiMessages = nextMessages.map((message) => ({
        id: message.id,
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
        is_liked: message.is_liked,
        audio: null,
      }));
      setMessages(uiMessages);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to load messages.');
    }
  };

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId]);

  const handleCreateChat = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    if (!user) return;

    try {
      const titleToUse = newChatTitle.trim() || 'New chat';
      const chat = await createChat(user.id, titleToUse);
      setChats((current) => [chat, ...current]);
      setActiveChatId(chat.id);
      setMessages([]);
      setNewChatTitle('');
      setStatusMessage('');
      return chat;
    } catch (error) {
      setStatusMessage(error.message || 'Unable to create chat.');
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!user) return;

    try {
      await deleteChat(chatId);
      const nextChats = chats.filter((chat) => chat.id !== chatId);
      setChats(nextChats);
      if (activeChatId === chatId) {
        setActiveChatId(nextChats[0]?.id || null);
      }
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to delete chat.');
    }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      await updateChatTitle(chatId, newTitle.trim());
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
        )
      );
    } catch (error) {
      setStatusMessage(error.message || 'Unable to rename chat.');
    }
  };

  const handleFeedback = async (messageId, isLiked) => {
    try {
      const updatedMessage = await updateMessageFeedback(messageId, isLiked);
      setMessages((current) =>
        current.map((message) =>
          message.id === updatedMessage.id ? { ...message, is_liked: updatedMessage.is_liked } : message
        )
      );
    } catch (error) {
      setStatusMessage(error.message || 'Unable to save feedback.');
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || !user) return;

    setIsLoading(true);
    let currentChatId = activeChatId;

    // If there is no active chat session yet, create one on the fly automatically
    if (!currentChatId) {
      try {
        const titleToUse = trimmedInput.length > 30 ? `${trimmedInput.substring(0, 30)}...` : trimmedInput;
        const newChat = await createChat(user.id, titleToUse);
        currentChatId = newChat.id;
        setActiveChatId(currentChatId);
        setChats((current) => [newChat, ...current]);
      } catch (error) {
        setMessages((current) => [...current, { role: 'error', content: error.message || 'Unable to create chat session.' }]);
        setIsLoading(false);
        return;
      }
    }

    const updatedMessages = [...messages, { role: 'user', content: trimmedInput }];
    setMessages(updatedMessages);
    setInput('');

    try {
      const response = await sendChatMessage({
        userId: user.id,
        chatId: currentChatId,
        prompt: trimmedInput,
        title: chats.find(c => c.id === currentChatId)?.title || 'New chat',
        history: messages.filter((message) => message.role !== 'error'),
      });

      const assistantMessage = {
        id: response.message_id,
        role: 'assistant',
        content: response.response,
        is_liked: null,
        audio: response.audio || null,
      };

      setMessages([...updatedMessages, assistantMessage]);
      await loadChats(user.id);
    } catch (error) {
      setMessages([...updatedMessages, { role: 'error', content: error.message || 'Unable to reach backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    handleSend,
    chatBoxRef,
    isLoading,
    isAuthLoading,
    user,
    handleLogin,
    handleRegister,
    handleLogout,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    dateOfBirth,
    setDateOfBirth,
    chats,
    activeChatId,
    setActiveChatId,
    newChatTitle,
    setNewChatTitle,
    handleCreateChat,
    handleDeleteChat,
    handleRenameChat,
    handleFeedback,
    statusMessage,
    setStatusMessage,
    authMode,
    setAuthMode: setAuthModeAndClearStatus,
    handleDeleteAccount,
    showDeleteModal,
    setShowDeleteModal,
  };
}