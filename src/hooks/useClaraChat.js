import { useEffect, useRef, useState } from 'react';
import {
  createChat,
  createUser,
  deleteChat,
  listMessages,
  listUserChats,
  sendChatMessage,
  updateMessageFeedback,
  getUser,
  loginUser,
  deleteUser,
} from '../api/claraApi';

export function useClaraChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clara_user');
    return saved ? JSON.parse(saved) : null;
  });

  const setAuthModeAndClearStatus = (mode) => {
    setAuthMode(mode);
    setStatusMessage(''); // Clears out lingering messages when switching views
  };

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const chatBoxRef = useRef(null);

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
  }, [messages]);


  // const handleLogin = async (event) => {
  //   event.preventDefault();
  //   if (!loginUserId.trim()) return;

  //   try {
  //     const fetchedUser = await getUser(loginUserId.trim());
  //     setUser(fetchedUser);
  //     setLoginUserId('');
  //     setStatusMessage(`Welcome back, ${fetchedUser.name}!`);
  //     await loadChats(fetchedUser.id);
  //   } catch (error) {
  //     setStatusMessage(error.message || 'User not found. Please check your User ID.');
  //   }
  // };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      const loggedInUser = await loginUser(email.trim(), password.trim());
      setUser(loggedInUser);
      setEmail('');
      setPassword('');
      setStatusMessage(`Welcome back, ${loggedInUser.first_name || loggedInUser.name}!`);
      await loadChats(loggedInUser.id);
    } catch (error) {
      setStatusMessage(error.message || 'Invalid credentials.');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !dateOfBirth) return;
    try {
      await createUser(
        firstName.trim(), 
        lastName.trim(), 
        email.trim(), 
        password.trim(), 
        dateOfBirth 
      );
      // Clear registration form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setDateOfBirth('');
      
      // Switch to login mode and show success banner
      setAuthMode('login');
      setStatusMessage('Account successfully created! Please enter your email and password to log in.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to create account.');
    }
  };
  //    setUser(createdUser);
  //    setFirstName('');
  //    setLastName('');
  //    setEmail('');
  //    setPassword('');
  //    setDateOfBirth('');
  //    setStatusMessage(`Account created! Welcome ${createdUser.name || firstName}!`);
  //    await loadChats(createdUser.id);
  //  } catch (error) {
  //    setStatusMessage(error.message || 'Unable to create account.');
  //  }
  // };

  // 
  const handleLogout = () => {
    setUser(null);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    localStorage.removeItem('clara_user');
    setAuthMode('login');
    setStatusMessage('Successfully logged out. Enter your credentials below to log back in.');
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
    event.preventDefault();
    if (!user || !newChatTitle.trim()) return;

    try {
      const chat = await createChat(user.id, newChatTitle.trim());
      setChats((current) => [chat, ...current]);
      setActiveChatId(chat.id);
      setMessages([]);
      setNewChatTitle('');
      setStatusMessage(''); // Cleared from chat window to prevent persistent status messaging overhead
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
    const updatedMessages = [...messages, { role: 'user', content: trimmedInput }];
    setMessages(updatedMessages);
    setInput('');

    try {
      const response = await sendChatMessage({
        userId: user.id,
        chatId: activeChatId,
        prompt: trimmedInput,
        title: newChatTitle || 'New chat',
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
      if (response.chat_id) {
        setActiveChatId(response.chat_id);
        setChats((current) => {
          if (current.some((chat) => chat.id === response.chat_id)) {
            return current;
          }

          return [
            { id: response.chat_id, user_id: user.id, title: newChatTitle || 'New chat', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            ...current,
          ];
        });
      }
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
    user,
    handleLogin,
    handleRegister,
    handleLogout,
    email,
    setEmail,
    password,
    setPassword,
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