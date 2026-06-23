import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Send } from 'lucide-react';
import { useClaraChat } from '../hooks/useClaraChat';
import { useState, useEffect } from 'react';

/**
 * Functional component rendering the pure visual structure of the CLARA chat workspace.
 * Uses Lucide icons for a streamlined, textless interactive layout button.
 */
export default function ChatWindow() {
  // Extract real-time memory variables, interactive event click handlers, and loading metrics
  const { messages, input, setInput, handleSend, chatBoxRef, isLoading } = useClaraChat();

  // Audio state management variables
  const [playingIndex, setPlayingIndex] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    // If the component unmounts, make sure we kill any running audio thread cycles instantly
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);



  /**
   * Event listener watching keyboard typing.
   * If a user strikes the 'Enter' key inside the text field, trigger the message dispatch pipeline.
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chat-container">
      {/* Visual Header Block containing title definitions */}
      <header>
        <h1>🤖 CLARA: AI Purchasing Assistant</h1>
        <p>🙋‍♀️ Hi I'm CLARA, let's talk about procurement and pricing!</p>
      </header>

      {/* Main scrolling dialog screen container mapped to our scroll manager DOM ref */}
      <div className="chat-box" ref={chatBoxRef}>
        {/* Loop through each message object in history and render custom styled speech bubbles */}
       
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            
            {msg.role === 'assistant' ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
            
            {msg.role === "assistant" && msg.audio && (
              <button 
                onClick={() => {
                  const isThisActive = playingIndex === index;

                  if (isThisActive && currentAudio) {
                    // 1. IF CLICKED WHILE ACTIVE -> PAUSE IT (Saves the timestamp position internally)
                    currentAudio.pause();
                    setPlayingIndex(null); // Sets button back to "Play" view, but keeps currentAudio in state
                  } else {
                    // 2. IF RESUMING THE SAME AUDIO TIMELINE
                    if (currentAudio && currentAudio.src.includes(`data:audio/wav;base64,${msg.audio}`)) {
                      setPlayingIndex(index);
                      currentAudio.play().catch(err => console.error("Playback error:", err));
                    } else {
                      // 3. IF PLAYING A COMPLETELY NEW MESSAGE BLOCK
                      if (currentAudio) {
                        currentAudio.pause(); // Kill any other audio running elsewhere
                      }

                      const audioPlayer = new Audio(`data:audio/wav;base64,${msg.audio}`);
                      
                      audioPlayer.onended = () => {
                        setPlayingIndex(null);
                        setCurrentAudio(null);
                      };

                      setCurrentAudio(audioPlayer);
                      setPlayingIndex(index);
                      audioPlayer.play().catch(err => console.error("Playback error:", err));
                    }
                  }
                }}
                className="play-audio-btn"
                style={{
                  marginTop: '8px',
                  padding: '6px 14px',
                  backgroundColor: playingIndex === index ? '#c547c1' : '#4A90E2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '500'
                }}
              >
                {playingIndex === index ? "⏸️ Pause" : "🔊 Play"}
              </button>
            )}

          </div>
        ))}




        {/* Dynamic Typing Indicator: Renders visually ONLY when CLARA is actively computing a response */}
        {isLoading && (
          <div className="message assistant typing-indicator">
            <em>Thinking...</em>
          </div>
        )}
      </div>

      {/* Input controls layout block containing text fields and submission buttons */}
      <div className="input-container">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Please wait for Clara to finish responding..." : "Type your message here..."} 
          autoComplete="off"
          disabled={isLoading}
        />
        
        {/* 
          Render the dynamic Lucide Send component.
          Passes size dimensions (18px) to fit smoothly within the circular button layout.
        */}
        <button onClick={handleSend} disabled={isLoading} className="icon-send-btn">
          {isLoading ? (
            <span className="spinner"></span>
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
