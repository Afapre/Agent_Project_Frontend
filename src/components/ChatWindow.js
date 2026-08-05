import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Send, Trash2, LogOut, MessageSquare, Sparkles, Volume2, Pause, ThumbsUp, ThumbsDown, UserX, Plus, Edit2, Check, X } from 'lucide-react';
import { useClaraChat } from '../hooks/useClaraChat';

export default function ChatWindow() {
  const {
    messages,
    input,
    setInput,
    handleSend,
    chatBoxRef,
    isLoading,
    isAuthLoading,
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
    statusMessage,
    setStatusMessage,
    authMode,
    setAuthMode,
    handleRegister,
    handleLogout,
    handleDeleteAccount,
    showDeleteModal,
    setShowDeleteModal,
  } = useClaraChat();

  const [playingIndex, setPlayingIndex] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  
  const textareaRef = useRef(null);

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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // --- Authentication Full-Screen View ---
  if (!user) {
    return (
      <div className="auth-viewport">
        <div className="auth-glass-card animate-fade-in">
          <div className="auth-header-brand">
            <div className="brand-icon-wrapper">
              <Sparkles className="w-7 h-7 text-indigo-600" />
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

  // --- Main Full-Screen Application Chat View ---
  return (
    <div className="app-viewport-shell">
      <aside className="app-sidebar">
        <div className="sidebar-top-section">
          <div className="sidebar-brand">
            <div className="brand-logo-small">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2>CLARA</h2>
              <span className="user-profile-badge">{user.first_name || user.name || 'User'}'s Workspace</span>
            </div>
          </div>

          <button 
            type="button" 
            className="new-chat-action-btn"
            onClick={handleCreateChat}
          >
            <Plus size={16} />
            <span>Add New Chat</span>
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
                  <button type="button" className="chat-select-btn" onClick={() => setActiveChatId(chat.id)}>
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

      <main className="chat-main-container">
        <header className="chat-header-bar">
          <div className="header-title-wrapper">
            <h1>CLARA: AI Procurement Assistant</h1>
            <p>An Advanced Procurement Processes Navigation Guide!</p>
          </div>
        </header>

        <div className="chat-messages-box" ref={chatBoxRef}>
          {messages.length === 0 && (
            <div className="chat-welcome-placeholder">
              <Sparkles className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
              <h3>How can I assist with your procurement needs today?</h3>
              {/* <p>Ask about supplier pricing benchmarks, draft negotiation strategies, or analyze contracts.</p> */}
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={msg.id || `${msg.role}-${index}`} className={`message-bubble-row ${msg.role}`}>
              <div className="message-content-wrapper">
                {msg.role === 'assistant' ? (
                  <div className="markdown-body">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
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
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-dock">
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-textarea-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Clara is analyzing...' : 'Type your message to CLARA ... '}
              rows={1}
              disabled={isLoading}
            />
            <button type="button" onClick={handleSend} disabled={isLoading || !input.trim()} className="send-action-icon-btn">
              {isLoading ? <span className="spinner-small"></span> : <Send size={18} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}