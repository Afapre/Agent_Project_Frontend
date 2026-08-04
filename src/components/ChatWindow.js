import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Send } from 'lucide-react';
import { useClaraChat } from '../hooks/useClaraChat';

export default function ChatWindow() {
  const {
    messages,
    input,
    setInput,
    handleSend,
    chatBoxRef,
    isLoading,
    user,
    handleLogin,
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
    setAuthMode,
    handleRegister,
    handleLogout,
    handleDeleteAccount,
    showDeleteModal,
    setShowDeleteModal,
  } = useClaraChat();

  const [playingIndex, setPlayingIndex] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // if (!user) {
  //   return (
  //     <div className="auth-card">
  //       <div className="auth-card__header">
  //         <h1>🤖 CLARA</h1>
  //         <p>Sign in to start chatting with your procurement assistant.</p>
  //       </div>
  //       <form onSubmit={handleLogin} className="auth-form">
  //         <label>
  //           Name
  //           <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" />
  //         </label>
  //         <label>
  //           Email
  //           <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" />
  //         </label>
  //         <button type="submit">Continue</button>
  //       </form>
  //       {statusMessage && <p className="status-message">{statusMessage}</p>}
  //     </div>
  //   );
  // }

  if (!user) {
    return (
      <div className="app-container">
        <div className="auth-card">
          {/* Status Message placed neatly at the top of the auth wrapper */}
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium transition-all duration-300 shadow-sm flex items-center justify-between ${
              statusMessage.includes('Successfully') || statusMessage.includes('created') || statusMessage.includes('Welcome')
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <span>{statusMessage}</span>
              <button 
                onClick={() => setStatusMessage('')} 
                className="ml-4 text-gray-400 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            </div>
          )}

          <div className="auth-card__header">
            <h1>🤖 CLARA</h1>
            <p>
              {authMode === 'register' 
                ? 'Create an account below to start chatting.' 
                : 'Enter your credentials below to log back in.'}
            </p>
          </div>

          {authMode === 'register' ? (
            <form onSubmit={handleRegister} className="auth-form">
              <label>
                First Name
                <input value={firstName} onChange={(event) => { setFirstName(event.target.value); setStatusMessage(''); }} placeholder="First name" required />
              </label>
              <label>
                Last Name
                <input value={lastName} onChange={(event) => { setLastName(event.target.value); setStatusMessage(''); }} placeholder="Last name" required />
              </label>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setStatusMessage(''); }} placeholder="Email address" required />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setStatusMessage(''); }} placeholder="Password" required />
              </label>
              <label>
                Date of Birth
                <input type="date" value={dateOfBirth} onChange={(event) => { setDateOfBirth(event.target.value); setStatusMessage(''); }} required />
              </label>
              <button type="submit">Create Account</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              <label>
                Email
                <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setStatusMessage(''); }} placeholder="Email address" required />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setStatusMessage(''); }} placeholder="Password" required />
              </label>
              <button type="submit">Sign In</button>
            </form>
          )}

          <div className="auth-switch">
            {authMode === 'register' ? (
              <p>Already have an account? <button type="button" className="text-link-btn" onClick={() => setAuthMode('login')}>Sign In</button></p>
            ) : (
              <p>New to Clara? <button type="button" className="text-link-btn" onClick={() => setAuthMode('register')}>Create Account</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <h2>CLARA</h2>
          <p>{user.first_name || user.name}</p>
          <div className="sidebar-actions">
            <button onClick={handleLogout} className="logout-btn">Log Out</button>
            <button onClick={() => setShowDeleteModal(true)} className="delete-account-btn">Delete Account</button>
          </div>

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform transition-all">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to permanently delete your account? All your chats and history will be lost. This action cannot be undone.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    No, Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      handleDeleteAccount(user.id);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors"
                  >
                    Yes, Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleCreateChat} className="chat-create-form">
          <input
            value={newChatTitle}
            onChange={(event) => setNewChatTitle(event.target.value)}
            placeholder="New chat title"
          />
          <button type="submit">Create</button>
        </form>

        <div className="chat-list">
          {chats.map((chat) => (
            <div key={chat.id} className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}>
              <button type="button" onClick={() => setActiveChatId(chat.id)}>
                {chat.title || 'Untitled chat'}
              </button>
              <button type="button" className="delete-chat-btn" onClick={() => handleDeleteChat(chat.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="chat-container">
        <header>
          <h1>CLARA: AI Purchasing Assistant</h1>
          <p>Let’s talk about procurement and pricing!</p>
        </header>

        <div className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, index) => (
            <div key={msg.id || `${msg.role}-${index}`} className={`message ${msg.role}`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}

              {msg.role === 'assistant' && msg.audio && (
                <button
                  type="button"
                  className="play-audio-btn"
                  onClick={() => {
                    const isThisActive = playingIndex === index;

                    if (isThisActive && currentAudio) {
                      currentAudio.pause();
                      setPlayingIndex(null);
                    } else {
                      if (currentAudio && currentAudio.src.includes(`data:audio/wav;base64,${msg.audio}`)) {
                        setPlayingIndex(index);
                        currentAudio.play().catch((error) => console.error('Playback error:', error));
                      } else {
                        if (currentAudio) {
                          currentAudio.pause();
                        }

                        const audioPlayer = new Audio(`data:audio/wav;base64,${msg.audio}`);
                        audioPlayer.onended = () => {
                          setPlayingIndex(null);
                          setCurrentAudio(null);
                        };

                        setCurrentAudio(audioPlayer);
                        setPlayingIndex(index);
                        audioPlayer.play().catch((error) => console.error('Playback error:', error));
                      }
                    }
                  }}
                >
                  {playingIndex === index ? '⏸ Pause' : '🔊 Play'}
                </button>
              )}

              {msg.role === 'assistant' && (
                <div className="feedback-row">
                  <button type="button" className={msg.is_liked === true ? 'active-feedback' : ''} onClick={() => handleFeedback(msg.id, true)}>
                    👍
                  </button>
                  <button type="button" className={msg.is_liked === false ? 'active-feedback' : ''} onClick={() => handleFeedback(msg.id, false)}>
                    👎
                  </button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="message assistant typing-indicator">
              <em>Thinking...</em>
            </div>
          )}
        </div>

        <div className="input-container">
          <input
            className="chat-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Please wait for Clara to finish responding...' : 'Type your message here...'}
            autoComplete="off"
            disabled={isLoading}
          />
          <button type="button" onClick={handleSend} disabled={isLoading} className="icon-send-btn">
            {isLoading ? <span className="spinner"></span> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}