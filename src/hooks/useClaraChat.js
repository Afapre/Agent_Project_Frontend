import { useEffect, useRef, useState } from 'react';
import {
  createChat,
  createUser,
  deleteChatContextDocument,
  deleteChat,
  deleteKnowledgeDocument,
  getUser,
  listKnowledgeDocuments,
  listChatContextDocuments,
  listMessages,
  listUserChats,
  sendChatMessage,
  uploadChatContext,
  uploadKnowledgeFiles,
  updateMessageFeedback,
  loginUser,
  deleteUser,
  updateChatTitle,
} from '../api/claraApi';
import { addContextDocumentForChat, clearContextDocumentsForChat } from './contextState';

const MAX_CONTEXT_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_CONTEXT_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
const CONTEXT_UPLOAD_HELPER_TEXT = `Accepted: ${SUPPORTED_CONTEXT_EXTENSIONS.join(', ')} up to ${formatFileSize(MAX_CONTEXT_UPLOAD_SIZE_BYTES)}.`;

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function validateContextFile(file) {
  if (!file) {
    return 'Choose a file to upload.';
  }

  const filename = (file.name || '').toLowerCase();
  const hasSupportedExtension = SUPPORTED_CONTEXT_EXTENSIONS.some((extension) => filename.endsWith(extension));

  if (!hasSupportedExtension) {
    return 'Unsupported file type. Upload PDF, DOCX, PNG, JPG, JPEG, or WEBP.';
  }

  if (file.size > MAX_CONTEXT_UPLOAD_SIZE_BYTES) {
    return `File is too large. Maximum upload size is ${formatFileSize(MAX_CONTEXT_UPLOAD_SIZE_BYTES)}.`;
  }

  return null;
}

export function useClaraChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSessionValidating, setIsSessionValidating] = useState(true);
  const [activeView, setActiveView] = useState('chat');
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false);
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
  const [isUploadingContext, setIsUploadingContext] = useState(false);
  const [uploadingContextName, setUploadingContextName] = useState('');
  const [chatContextDocuments, setChatContextDocuments] = useState({});
  const [knowledgeDocuments, setKnowledgeDocuments] = useState([]);
  const [knowledgeDeleteTarget, setKnowledgeDeleteTarget] = useState(null);
  const [removingDocumentIds, setRemovingDocumentIds] = useState([]);
  const [removingKnowledgeDocumentIds, setRemovingKnowledgeDocumentIds] = useState([]);
  const chatBoxRef = useRef(null);

  const setAuthModeAndClearStatus = (mode) => {
    setAuthMode(mode);
    setStatusMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    let isCancelled = false;

    const validateSavedSession = async () => {
      if (!user?.id) {
        if (!isCancelled) {
          setIsSessionValidating(false);
        }
        return;
      }

      try {
        const verifiedUser = await getUser(user.id);
        if (!isCancelled) {
          setUser(verifiedUser);
        }
      } catch {
        if (!isCancelled) {
          setUser(null);
          setChats([]);
          setMessages([]);
          setActiveChatId(null);
          setChatContextDocuments({});
          setAuthMode('login');
          setStatusMessage('Your saved session is no longer valid. Please sign in again.');
        }
      } finally {
        if (!isCancelled) {
          setIsSessionValidating(false);
        }
      }
    };

    validateSavedSession();

    return () => {
      isCancelled = true;
    };
    // Intentionally run once on initial mount to validate persisted auth state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isSessionValidating) {
      return;
    }

    if (user) {
      localStorage.setItem('clara_user', JSON.stringify(user));
      loadChats(user.id);
    } else {
      localStorage.removeItem('clara_user');
    }
  }, [user, isSessionValidating]);

  useEffect(() => {
    if (isSessionValidating || !user || activeView !== 'knowledge') {
      return;
    }

    let isCancelled = false;

    const loadKnowledgeDocuments = async () => {
      try {
        const documents = await listKnowledgeDocuments({ userId: user.id });
        if (!isCancelled) {
          setKnowledgeDocuments(documents);
        }
      } catch (error) {
        if (!isCancelled) {
          setStatusMessage(error.message || 'Unable to load knowledge documents.');
        }
      }
    };

    loadKnowledgeDocuments();

    return () => {
      isCancelled = true;
    };
  }, [activeView, user, isSessionValidating]);

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
    setChatContextDocuments({});
    setKnowledgeDocuments([]);
    setKnowledgeDeleteTarget(null);
    setActiveView('chat');
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
      setChatContextDocuments({});
      setKnowledgeDocuments([]);
      setKnowledgeDeleteTarget(null);
      setActiveView('chat');
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

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    let isCancelled = false;

    const loadActiveChatState = async () => {
      try {
        const nextMessages = await listMessages(activeChatId);
        if (!isCancelled) {
          const uiMessages = nextMessages.map((message) => ({
            id: message.id,
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content,
            is_liked: message.is_liked,
            audio: null,
          }));
          setMessages(uiMessages);
        }
      } catch (error) {
        if (!isCancelled) {
          setStatusMessage(error.message || 'Unable to load messages.');
        }
      }

      if (!user) {
        return;
      }

      try {
        const documents = await listChatContextDocuments({ chatId: activeChatId, userId: user.id });
        if (!isCancelled) {
          setChatContextDocuments((current) => ({
            ...current,
            [activeChatId]: documents,
          }));
        }
      } catch (error) {
        if (!isCancelled) {
          setStatusMessage(error.message || 'Unable to load context documents.');
        }
      }
    };

    loadActiveChatState();

    return () => {
      isCancelled = true;
    };
  }, [activeChatId, user]);

  const ensureActiveChat = async (fallbackTitle) => {
    if (activeChatId) {
      return activeChatId;
    }

    const titleToUse = (fallbackTitle || '').trim() || 'New chat';
    const chat = await createChat(user.id, titleToUse);
    setChats((current) => [chat, ...current]);
    setActiveChatId(chat.id);
    setMessages([]);
    return chat.id;
  };

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
      setChatContextDocuments((current) => {
        const next = { ...current };
        delete next[chatId];
        return next;
      });
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

  const handleUploadContext = async (file) => {
    if (!file || !user || isUploadingContext) return null;

    const validationError = validateContextFile(file);
    if (validationError) {
      setStatusMessage(validationError);
      return null;
    }

    setIsUploadingContext(true);
  setUploadingContextName(file.name || 'Selected file');
    setStatusMessage('');

    try {
      const chatId = await ensureActiveChat(file.name.replace(/\.[^.]+$/, ''));
      const uploadedDocument = await uploadChatContext({
        file,
        userId: user.id,
        chatId,
      });

      setChatContextDocuments((current) => addContextDocumentForChat(current, chatId, uploadedDocument));
      setStatusMessage(`${uploadedDocument.filename} is ready as chat context.`);
      return uploadedDocument;
    } catch (error) {
      setStatusMessage(error.message || 'Unable to upload context document.');
      return null;
    } finally {
      setIsUploadingContext(false);
      setUploadingContextName('');
    }
  };

  const handleUploadKnowledge = async (files) => {
    const fileList = Array.isArray(files) ? files.filter(Boolean) : [];
    if (!user || isUploadingKnowledge || fileList.length === 0) return null;

    setIsUploadingKnowledge(true);
    setStatusMessage('');

    try {
      const response = await uploadKnowledgeFiles({
        files: fileList,
        userId: user.id,
      });

      const successCount = response?.success?.length || 0;
      const errorCount = response?.errors?.length || 0;
      if (successCount > 0 && errorCount === 0) {
        setStatusMessage(`${successCount} knowledge file${successCount === 1 ? '' : 's'} uploaded successfully.`);
      } else if (successCount > 0) {
        setStatusMessage(`${successCount} file${successCount === 1 ? '' : 's'} uploaded, ${errorCount} file${errorCount === 1 ? '' : 's'} need attention.`);
      } else {
        setStatusMessage('Unable to upload knowledge files.');
      }

      const refreshedDocuments = await listKnowledgeDocuments({ userId: user.id });
      setKnowledgeDocuments(refreshedDocuments);

      return response;
    } catch (error) {
      setStatusMessage(error.message || 'Unable to upload knowledge files.');
      return null;
    } finally {
      setIsUploadingKnowledge(false);
    }
  };

  const removeContextDocument = async (documentId) => {
    if (!activeChatId || !user || removingDocumentIds.includes(documentId)) return;

    const activeDocument = (chatContextDocuments[activeChatId] || []).find((document) => document.id === documentId);
    setRemovingDocumentIds((current) => [...current, documentId]);
    setStatusMessage('');

    try {
      await deleteChatContextDocument({
        chatId: activeChatId,
        documentId,
        userId: user.id,
      });

      setChatContextDocuments((current) => ({
        ...current,
        [activeChatId]: (current[activeChatId] || []).filter((document) => document.id !== documentId),
      }));
      if (activeDocument?.filename) {
        setStatusMessage(`${activeDocument.filename} was removed from this chat.`);
      }
    } catch (error) {
      setStatusMessage(error.message || 'Unable to remove context document.');
    } finally {
      setRemovingDocumentIds((current) => current.filter((id) => id !== documentId));
    }
  };

  const handleDeleteKnowledgeDocument = async (documentId) => {
    if (!user || removingKnowledgeDocumentIds.includes(documentId)) return;

    setRemovingKnowledgeDocumentIds((current) => [...current, documentId]);
    setStatusMessage('');

    try {
      await deleteKnowledgeDocument({ userId: user.id, documentId });
      setKnowledgeDocuments((current) => current.filter((document) => document.id !== documentId));
      setKnowledgeDeleteTarget(null);
      setStatusMessage('Knowledge document removed.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to remove knowledge document.');
    } finally {
      setRemovingKnowledgeDocumentIds((current) => current.filter((id) => id !== documentId));
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
      const attachedDocuments = chatContextDocuments[currentChatId] || [];
      const response = await sendChatMessage({
        userId: user.id,
        chatId: currentChatId,
        prompt: trimmedInput,
        title: chats.find(c => c.id === currentChatId)?.title || 'New chat',
        history: messages.filter((message) => message.role !== 'error'),
        documentIds: attachedDocuments.map((document) => document.id),
      });

      const assistantMessage = {
        id: response.message_id,
        role: 'assistant',
        content: response.response,
        is_liked: null,
        audio: response.audio || null,
      };

      setMessages([...updatedMessages, assistantMessage]);
      setChatContextDocuments((current) => clearContextDocumentsForChat(current, currentChatId));
      await loadChats(user.id);
    } catch (error) {
      setMessages([...updatedMessages, { role: 'error', content: error.message || 'Unable to reach backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeDocuments = activeChatId ? (chatContextDocuments[activeChatId] || []) : [];

  return {
    messages,
    input,
    setInput,
    handleSend,
    chatBoxRef,
    isLoading,
    isAuthLoading,
    isSessionValidating,
    activeView,
    setActiveView,
    isUploadingKnowledge,
    knowledgeDocuments,
    knowledgeDeleteTarget,
    setKnowledgeDeleteTarget,
    removingKnowledgeDocumentIds,
    handleUploadKnowledge,
    handleDeleteKnowledgeDocument,
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
    activeDocuments,
    isUploadingContext,
    uploadingContextName,
    contextUploadHelperText: CONTEXT_UPLOAD_HELPER_TEXT,
    removingDocumentIds,
    handleUploadContext,
    removeContextDocument,
    statusMessage,
    setStatusMessage,
    authMode,
    setAuthMode: setAuthModeAndClearStatus,
    handleDeleteAccount,
    showDeleteModal,
    setShowDeleteModal,
  };
}