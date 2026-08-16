import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { Send, Trash2, LogOut, MessageSquare, Volume2, Pause, ThumbsUp, ThumbsDown, UserX, Plus, Edit2, Check, X, Paperclip, FileText, Moon, Sun, Menu, Sparkles, Layers, ShieldAlert } from 'lucide-react';
import { useClaraChat } from '../hooks/useClaraChat';
import claraLogo from '../assets/clara-logo.png';

export default function ChatWindow() {
  const {
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
    handleCreateChat,
    handleDeleteChat,
    handleRenameChat,
    handleFeedback,
    activeDocuments,
    isUploadingContext,
    uploadingContextName,
    contextUploadHelperText,
    removingDocumentIds,
    handleUploadContext,
    removeContextDocument,
    contextDeleteTarget,
    setContextDeleteTarget,
    statusMessage,
    setStatusMessage,
    authMode,
    setAuthMode,
    handleRegister,
    handleLogout,
    handleDeleteAccount,
    showDeleteModal,
    setShowDeleteModal,
    pendingActions,
    actionProcessingId,
    editingActionId,
    setEditingActionId,
    editActionPayload,
    setEditActionPayload,
    handleApproveAction,
    handleRejectAction,
  } = useClaraChat();

  const [playingIndex, setPlayingIndex] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [selectedKnowledgeFiles, setSelectedKnowledgeFiles] = useState([]);
  const [amendmentTargetId, setAmendmentTargetId] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('clara_theme') === 'dark');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const knowledgeInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  useEffect(() => {
    localStorage.setItem('clara_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileSelection = async (event) => {
    const [selectedFile] = Array.from(event.target.files || []);
    if (!selectedFile) return;

    await handleUploadContext(selectedFile);
    event.target.value = '';
  };

  const handleKnowledgeFileSelection = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (!nextFiles.length) return;

    setSelectedKnowledgeFiles((current) => {
      const existingKeys = new Set(
        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );
      const uniqueAdditions = nextFiles.filter(
        (file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
      );
      return [...current, ...uniqueAdditions];
    });

    // Allow selecting additional files one by one in subsequent picks.
    event.target.value = '';
  };

  const submitKnowledgeFiles = async () => {
    if (!selectedKnowledgeFiles.length) return;

    await handleUploadKnowledge(selectedKnowledgeFiles, amendmentTargetId || undefined);
    setSelectedKnowledgeFiles([]);
    setAmendmentTargetId('');
    if (knowledgeInputRef.current) {
      knowledgeInputRef.current.value = '';
    }
  };

  if (isSessionValidating) {
    return (
      <div className={`auth-viewport ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="auth-glass-card animate-fade-in">
          <div className="auth-header-brand">
            <div className="brand-icon-wrapper">
              <img src={claraLogo} alt="CLARA logo" className="clara-logo-auth" />
            </div>
            <h1>CLARA</h1>
            <p>Checking your saved session...</p>
          </div>
          <div className="spinner-center" aria-hidden="true"></div>
        </div>
      </div>
    );
  }

  // --- Authentication Full-Screen View ---
  if (!user) {
    return (
      <div className={`auth-viewport ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="auth-glass-card animate-fade-in">
          <div className="auth-header-brand">
            <div className="brand-icon-wrapper">
              <img src={claraLogo} alt="CLARA logo" className="clara-logo-auth" />
            </div>
            <h1>CLARA</h1>
            <p>
              {authMode === 'register' 
                ? 'Enter your details to create your CLARA account' 
                : 'Sign in to access your CLARA workspace'}
            </p>
          </div>

          {statusMessage && (
            <div className={`status-banner ${
              statusMessage.includes('Successfully') || statusMessage.includes('created') || statusMessage.includes('Welcome')
                ? 'status-success' 
                : 'status-error'
            }`}>
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="status-close-btn">&times;</button>
            </div>
          )}

          {authMode === 'register' ? (
            <form onSubmit={handleRegister} className="auth-form-grid">
              <div className="input-row-group">
                <label className="input-field-block">
                  <span>First Name</span>
                  <input 
                    value={firstName} 
                    onChange={(e) => { setFirstName(e.target.value); setStatusMessage(''); }} 
                    placeholder="John" 
                    required 
                  />
                </label>
                <label className="input-field-block">
                  <span>Last Name</span>
                  <input 
                    value={lastName} 
                    onChange={(e) => { setLastName(e.target.value); setStatusMessage(''); }} 
                    placeholder="Doe" 
                    required 
                  />
                </label>
              </div>
              
              <label className="input-field-block">
                <span>Email Address</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setStatusMessage(''); }} 
                  placeholder="name@company.com" 
                  required 
                />
              </label>
              
              <div className="input-row-group">
                <label className="input-field-block">
                  <span>Password (min 8 chars)</span>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setStatusMessage(''); }} 
                    placeholder="••••••••" 
                    minLength={8}
                    required 
                  />
                </label>
                <label className="input-field-block">
                  <span>Confirm Password</span>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => { setConfirmPassword(e.target.value); setStatusMessage(''); }} 
                    placeholder="••••••••" 
                    required 
                  />
                </label>
              </div>

              <label className="input-field-block">
                <span>Date of Birth</span>
                <input 
                  type="date" 
                  value={dateOfBirth} 
                  onChange={(e) => { setDateOfBirth(e.target.value); setStatusMessage(''); }} 
                  required 
                />
              </label>
              
              <button type="submit" className="primary-action-btn" disabled={isAuthLoading}>
                {isAuthLoading ? <span className="spinner-center"></span> : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form-grid">
              <label className="input-field-block">
                <span>Email Address</span>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setStatusMessage(''); }} placeholder="name@company.com" required />
              </label>
              <label className="input-field-block">
                <span>Password</span>
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setStatusMessage(''); }} placeholder="••••••••" required />
              </label>
              
              <button type="submit" className="primary-action-btn" disabled={isAuthLoading}>
                {isAuthLoading ? <span className="spinner-center"></span> : 'Sign In'}
              </button>
            </form>
          )}

          <div className="auth-switch-prompt">
            {authMode === 'register' ? (
              <p>Already have an account? <button type="button" className="text-link-action" onClick={() => { setAuthMode('login'); setEmail('');setPassword('');setStatusMessage(''); }}>Sign In</button></p>
            ) : (
              <p>New to CLARA? <button type="button" className="text-link-action" onClick={() => { setAuthMode('register'); setEmail('');setPassword('');setStatusMessage(''); }}>Create Account</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main Full-Screen Application Dashboard View ---
  return (
    <div className={`app-viewport-shell dashboard-shell ${isDarkMode ? 'dark-mode' : ''}`}>
      {isMobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setIsMobileNavOpen(false)} />
      )}
      <aside className={`app-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top-section">
          <div className="sidebar-brand">
            <div className="brand-logo-small">
              <img src={claraLogo} alt="CLARA logo" className="clara-logo-sidebar" />
            </div>
            <div>
              <h2>CLARA</h2>
              <span className="user-profile-badge">{user.first_name || user.name || 'User'}'s Workspace</span>
            </div>
            <button
              type="button"
              className="mobile-nav-close-btn"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>

          <button 
            type="button" 
            className="new-chat-action-btn"
            onClick={() => {
              setActiveView('chat');
              handleCreateChat();
            }}
          >
            <Plus size={16} />
            <span>Add New Chat</span>
          </button>

          <button
            type="button"
            className="knowledge-action-btn"
            onClick={() => setActiveView('knowledge')}
          >
            <FileText size={16} />
            <span>Upload Knowledge</span>
          </button>
        </div>

        <div className="sidebar-section-title">Chat History</div>

        <div className="chat-history-list">
          {chats.map((chat) => (
            <div key={chat.id} className={`chat-item-row ${chat.id === activeChatId ? 'active' : ''}`}>
              {editingChatId === chat.id ? (
                <div className="chat-rename-inline-box" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingTitleValue}
                    onChange={(e) => setEditingTitleValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (editingTitleValue.trim()) {
                          handleRenameChat(chat.id, editingTitleValue.trim());
                        }
                        setEditingChatId(null);
                      } else if (e.key === 'Escape') {
                        setEditingChatId(null);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (editingTitleValue.trim()) {
                        handleRenameChat(chat.id, editingTitleValue.trim());
                      }
                      setEditingChatId(null);
                    }} 
                    className="rename-save-btn"
                  >
                    <Check size={13} />
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingChatId(null);
                    }} 
                    className="rename-cancel-btn"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <button type="button" className="chat-select-btn" onClick={() => { setActiveView('chat'); setActiveChatId(chat.id); }}>
                    <MessageSquare size={15} />
                    <span className="chat-title-text">{chat.title || 'Untitled chat'}</span>
                  </button>
                  <div className="chat-item-actions">
                    <button 
                      type="button" 
                      className="chat-action-icon-trigger" 
                      onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditingTitleValue(chat.title || ''); }} 
                      title="Rename chat"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      type="button" 
                      className="chat-action-icon-trigger delete-trigger" 
                      onClick={(e) => { e.stopPropagation(); setChatToDelete(chat.id); }} 
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="footer-btn theme-toggle-btn"
            onClick={() => setIsDarkMode((current) => !current)}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => setShowLogoutModal(true)} className="footer-btn logout-action">
            <LogOut size={15} /> Sign Out
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="footer-btn delete-account-action" title="Delete Account">
            <UserX size={15} />
          </button>
        </div>
      </aside>

      {/* Delete Chat Confirmation Modal */}
      {chatToDelete && (
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-in">
            <h3>Delete Chat?</h3>
            <p>Are you sure you want to delete this chat history? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setChatToDelete(null)} className="modal-cancel-btn">Cancel</button>
              <button onClick={() => { handleDeleteChat(chatToDelete); setChatToDelete(null); }} className="modal-confirm-btn">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-in">
            <h3>Sign Out Confirmation</h3>
            <p>Are you sure you want to sign out of your CLARA workspace?</p>
            <div className="modal-actions">
              <button onClick={() => setShowLogoutModal(false)} className="modal-cancel-btn">Cancel</button>
              <button onClick={() => { setShowLogoutModal(false); handleLogout(); }} className="modal-confirm-btn primary-confirm">Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-in">
            <h3>Delete Account Permanently?</h3>
            <p>
              Are you sure you want to permanently delete your account? All your chats, pricing workflows, and history will be lost. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="modal-cancel-btn">
                Cancel
              </button>
              <button onClick={() => { setShowDeleteModal(false); handleDeleteAccount(user.id); }} className="modal-confirm-btn">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {knowledgeDeleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-in">
            <h3>Delete Knowledge File?</h3>
            <p>
              Are you sure you want to delete <strong>{knowledgeDeleteTarget.filename}</strong> from your shared knowledge library? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={() => setKnowledgeDeleteTarget(null)} className="modal-cancel-btn">Cancel</button>
              <button
                onClick={() => handleDeleteKnowledgeDocument(knowledgeDeleteTarget.id)}
                className="modal-confirm-btn delete-trigger"
                disabled={removingKnowledgeDocumentIds.includes(knowledgeDeleteTarget.id)}
              >
                {removingKnowledgeDocumentIds.includes(knowledgeDeleteTarget.id) ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {contextDeleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-in">
            <h3>Remove Attached Document?</h3>
            <p>
              Are you sure you want to remove <strong>{contextDeleteTarget.filename}</strong> from this chat? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={() => setContextDeleteTarget(null)} className="modal-cancel-btn">Cancel</button>
              <button
                onClick={() => removeContextDocument(contextDeleteTarget.id)}
                className="modal-confirm-btn delete-trigger"
                disabled={removingDocumentIds.includes(contextDeleteTarget.id)}
              >
                {removingDocumentIds.includes(contextDeleteTarget.id) ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="chat-main-container">
        {activeView === 'knowledge' ? (
          <div className="knowledge-workspace">
            <header className="chat-header-bar knowledge-header-bar">
              <div className="header-title-wrapper">
                <div className="header-brandline">
                  <button
                    type="button"
                    className="mobile-nav-toggle-btn"
                    onClick={() => setIsMobileNavOpen(true)}
                    aria-label="Open navigation"
                  >
                    <Menu size={18} />
                  </button>
                  <img src={claraLogo} alt="CLARA logo" className="clara-logo-header" />
                  <h1>Knowledge Library</h1>
                </div>
                <p>Upload PDFs, DOCX files, and Images that Clara can search across all your chats.</p>
              </div>
              <button type="button" className="back-to-chat-btn" onClick={() => setActiveView('chat')}>
                Back to chat
              </button>
            </header>

            <section className="knowledge-panel-shell">
              <div className="knowledge-upload-card">
                {statusMessage && (
                  <div className={`status-banner ${
                    statusMessage.includes('uploaded') || statusMessage.includes('successfully')
                      ? 'status-success'
                      : 'status-error'
                  }`}>
                    <span>{statusMessage}</span>
                    <button onClick={() => setStatusMessage('')} className="status-close-btn">&times;</button>
                  </div>
                )}

                <div className="knowledge-upload-copy">
                  <h3>Upload shared knowledge</h3>
                  <p>
                    Add reference files once and Clara will use them as shared knowledge in any chat for your account.You can keep uploading more files later without losing prior knowledge.
                  </p>
                </div>

                <input
                  ref={knowledgeInputRef}
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                  multiple
                  onChange={handleKnowledgeFileSelection}
                  hidden
                />

                <div className="knowledge-upload-dropzone">
                  <Paperclip size={18} />
                  <div>
                    <strong>Select knowledge files</strong>
                    <p> You may select more than one file before uploading if needed.</p>
                  </div>
                  <button
                    type="button"
                    className="knowledge-select-btn"
                    onClick={() => knowledgeInputRef.current?.click()}
                    aria-label="Add knowledge file"
                    title="Add file"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <p className="knowledge-upload-format-text">Accepted: PDF, DOCX, PNG, JPG, JPEG, WEBP</p>

                {selectedKnowledgeFiles.length > 0 && (
                  <div className="knowledge-file-list">
                    {selectedKnowledgeFiles.map((file) => (
                      <div key={`${file.name}-${file.size}`} className="knowledge-file-pill">
                        <FileText size={14} />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {knowledgeDocuments.length > 0 && (
                  <label className="knowledge-amendment-select">
                    <span>Is this an amendment to an existing file? (optional)</span>
                    <select
                      value={amendmentTargetId}
                      onChange={(e) => setAmendmentTargetId(e.target.value)}
                    >
                      <option value="">No, this is a new document</option>
                      {knowledgeDocuments.map((document) => (
                        <option key={document.id} value={document.id}>
                          Amends: {document.filename}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="knowledge-upload-actions">
                  <button
                    type="button"
                    className="knowledge-secondary-btn"
                    onClick={() => {
                      setSelectedKnowledgeFiles([]);
                      if (knowledgeInputRef.current) knowledgeInputRef.current.value = '';
                    }}
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    className="knowledge-primary-btn"
                    onClick={submitKnowledgeFiles}
                    disabled={isUploadingKnowledge || selectedKnowledgeFiles.length === 0}
                  >
                    {isUploadingKnowledge ? 'Uploading...' : 'Upload knowledge'}
                  </button>
                </div>
              </div>

              <div className="knowledge-panel-notes">
                <div className="knowledge-note-card">
                  <div className="knowledge-section-title">Knowledge Files</div>
                  {knowledgeDocuments.length > 0 ? (
                    <div className="knowledge-document-list">
                      {knowledgeDocuments.map((document) => (
                        <div key={document.id} className="knowledge-document-row">
                          <div className="knowledge-document-main">
                            <FileText size={15} />
                            <strong className="knowledge-document-name">{document.filename}</strong>
                            {document.related_document_filename && (
                              <span className="knowledge-amendment-badge">Amends: {document.related_document_filename}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="knowledge-delete-btn"
                            onClick={() => setKnowledgeDeleteTarget(document)}
                            disabled={removingKnowledgeDocumentIds.includes(document.id)}
                            aria-label={`Delete ${document.filename}`}
                          >
                            {removingKnowledgeDocumentIds.includes(document.id) ? (
                              '...'
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="knowledge-empty-state">No shared knowledge uploaded yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <>
        <header className="chat-header-bar">
          <div className="header-title-wrapper">
            <div className="header-brandline">
              <button
                type="button"
                className="mobile-nav-toggle-btn"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>
              <img src={claraLogo} alt="CLARA logo" className="clara-logo-header" />
              <h1>CLARA: AI Procurement Assistant</h1>
            </div>
            <p>An Advanced Procurement Processes Navigation Guide!</p>
          </div>
        </header>

        {statusMessage && (
          <div className="chat-status-wrap">
            <div className={`status-banner ${
              statusMessage.includes('ready') || statusMessage.includes('Successfully') || statusMessage.includes('Welcome') || statusMessage.includes('created')
                ? 'status-success'
                : 'status-error'
            }`}>
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="status-close-btn">&times;</button>
            </div>
          </div>
        )}

        <div className="chat-messages-box" ref={chatBoxRef}>
          {messages.length === 0 && (
            <div className="chat-welcome-placeholder">
              <img src={claraLogo} alt="CLARA logo" className="clara-logo-welcome" />
              <h3>How can I assist with your procurement needs today?</h3>
              {/* <p>Ask about supplier pricing benchmarks, draft negotiation strategies, or analyze contracts.</p> */}
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={msg.id || `${msg.role}-${index}`} className={`message-bubble-row ${msg.role}`}>
              <div className="message-content-wrapper">
                {msg.role === 'assistant' ? (
                  <div className="markdown-body">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} >{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="plain-user-text">{msg.content}</div>
                )}

                {msg.role === 'assistant' && msg.audio && (
                  <button
                    type="button"
                    className="audio-player-trigger"
                    onClick={() => {
                      const isThisActive = playingIndex === index;
                      if (isThisActive && currentAudio) {
                        currentAudio.pause();
                        setPlayingIndex(null);
                      } else {
                        if (currentAudio) currentAudio.pause();
                        const audioPlayer = new Audio(`data:audio/wav;base64,${msg.audio}`);
                        audioPlayer.onended = () => {
                          setPlayingIndex(null);
                          setCurrentAudio(null);
                        };
                        setCurrentAudio(audioPlayer);
                        setPlayingIndex(index);
                        audioPlayer.play().catch((err) => console.error('Playback error:', err));
                      }
                    }}
                  >
                    {playingIndex === index ? <Pause size={14} /> : <Volume2 size={14} />}
                    <span>{playingIndex === index ? 'Pause Voice' : 'Listen'}</span>
                  </button>
                )}

                {msg.role === 'assistant' && (
                  <div className="feedback-action-row">
                    <button type="button" className={msg.is_liked === true ? 'liked-active' : ''} onClick={() => handleFeedback(msg.id, true)}>
                      <ThumbsUp size={13} />
                    </button>
                    <button type="button" className={msg.is_liked === false ? 'disliked-active' : ''} onClick={() => handleFeedback(msg.id, false)}>
                      <ThumbsDown size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-bubble-row assistant">
              <div className="message-content-wrapper typing-bubble">
                <img src={claraLogo} alt="CLARA logo" className="clara-logo-typing" />
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-dock">
          <div className="context-upload-meta-row">
            <p className="context-upload-helper">{contextUploadHelperText}</p>
            {isUploadingContext && (
              <div className="context-upload-status" role="status" aria-live="polite">
                <span className="context-upload-spinner" aria-hidden="true"></span>
                <span>Indexing {uploadingContextName} for this chat...</span>
              </div>
            )}
          </div>

          <div className="textarea-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelection}
              hidden
            />
            <button
              type="button"
              className="attach-context-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploadingContext}
              title="Attach a PDF, Word document, or image"
            >
              <Paperclip size={16} />
              <span>{isUploadingContext ? 'Indexing...' : 'Attach context'}</span>
            </button>
            <textarea
              ref={textareaRef}
              className="chat-textarea-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Clara is analyzing...' : 'Type your message to CLARA ... '}
              rows={1}
              disabled={isLoading || isUploadingContext}
            />
            <button type="button" onClick={handleSend} disabled={isLoading || isUploadingContext || !input.trim()} className="send-action-icon-btn">
              {isLoading ? <span className="spinner-small"></span> : <Send size={18} />}
            </button>
          </div>
          </div>
            </>
          )}
      </main>

      {activeView === 'chat' && (
        <aside className="app-context-panel">
          <div className="context-panel-section">
            <div className="context-panel-title">
              <Sparkles size={14} />
              <span>Session Insights</span>
            </div>
            <h3 className="context-panel-chat-name">
              {chats.find((chat) => chat.id === activeChatId)?.title || 'Untitled chat'}
            </h3>
            <div className="context-stat-grid">
              <div className="context-stat-card">
                <span className="context-stat-value">{messages.length}</span>
                <span className="context-stat-label">Messages</span>
              </div>
              <div className="context-stat-card">
                <span className="context-stat-value">{activeDocuments.length}</span>
                <span className="context-stat-label">Attached Files</span>
              </div>
            </div>
          </div>

          <div className="context-panel-section">
            <div className="context-panel-title">
              <ShieldAlert size={14} />
              <span>Action Queue</span>
              {pendingActions.length > 0 && (
                <span className="action-queue-badge">{pendingActions.length}</span>
              )}
            </div>
            {pendingActions.length > 0 ? (
              <div className="action-queue-list">
                {pendingActions.map((action) => (
                  <div key={action.id} className={`action-queue-card tier-${action.authority_tier}`}>
                    <div className="action-queue-header">
                      <span className="action-type-label">{action.action_type.replace(/_/g, ' ')}</span>
                      <span className={`authority-badge ${action.authority_tier}`}>
                        {action.authority_tier === 'binding' ? 'Manager sign-off' : action.authority_tier === 'standard' ? 'Confirmation' : 'Routine'}
                      </span>
                    </div>
                    {action.reasoning && (
                      <p className="action-reasoning">{action.reasoning}</p>
                    )}
                    {action.source_documents?.length > 0 && (
                      <div className="action-source-docs">
                        {action.source_documents.map((doc) => (
                          <span key={doc} className="action-doc-chip">{doc}</span>
                        ))}
                      </div>
                    )}
                    {action.payload && (
                      <details className="action-payload-details">
                        <summary>View details</summary>
                        <pre>{JSON.stringify(action.payload, null, 2)}</pre>
                      </details>
                    )}
                    {editingActionId === action.id ? (
                      <div className="action-edit-area">
                        <textarea
                          value={editActionPayload}
                          onChange={(e) => setEditActionPayload(e.target.value)}
                          placeholder="Edit action payload (JSON)..."
                          rows={4}
                        />
                        <div className="action-btn-row">
                          <button
                            type="button"
                            className="action-btn approve"
                            disabled={actionProcessingId === action.id}
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(editActionPayload);
                                handleApproveAction(action.id, parsed);
                              } catch {
                                handleApproveAction(action.id);
                              }
                            }}
                          >
                            <Check size={14} /> Save & Approve
                          </button>
                          <button type="button" className="action-btn cancel" onClick={() => { setEditingActionId(null); setEditActionPayload(''); }}>
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="action-btn-row">
                        <button
                          type="button"
                          className="action-btn approve"
                          disabled={actionProcessingId === action.id}
                          onClick={() => handleApproveAction(action.id)}
                        >
                          {actionProcessingId === action.id ? '...' : <><Check size={14} /> Approve</>}
                        </button>
                        <button
                          type="button"
                          className="action-btn edit"
                          disabled={actionProcessingId === action.id}
                          onClick={() => {
                            setEditingActionId(action.id);
                            setEditActionPayload(JSON.stringify(action.payload, null, 2));
                          }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className="action-btn reject"
                          disabled={actionProcessingId === action.id}
                          onClick={() => handleRejectAction(action.id)}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="context-panel-empty">No pending actions. Clara will queue binding actions here for your approval.</p>
            )}
          </div>

          <div className="context-panel-section">
            <div className="context-panel-title">
              <FileText size={14} />
              <span>Attached Documents</span>
            </div>
            {activeDocuments.length > 0 ? (
              <div className="context-panel-doc-list">
                {activeDocuments.map((document) => (
                  <div key={document.id} className="context-panel-doc-row">
                    <FileText size={14} />
                    <span className="context-panel-doc-name">{document.filename}</span>
                    <button
                      type="button"
                      onClick={() => setContextDeleteTarget(document)}
                      disabled={removingDocumentIds.includes(document.id)}
                      aria-label={`Remove ${document.filename}`}
                    >
                      {removingDocumentIds.includes(document.id) ? '...' : <X size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="context-panel-empty">No files attached to this chat yet. Use "Attach context" below the message box.</p>
            )}
          </div>

          <div className="context-panel-section context-panel-shortcut">
            <div className="context-panel-title">
              <FileText size={14} />
              <span>Knowledge Library</span>
            </div>
            <p className="context-panel-empty">Manage reference files shared across all your chats.</p>
            <button type="button" className="context-panel-link-btn" onClick={() => setActiveView('knowledge')}>
              Open library
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}