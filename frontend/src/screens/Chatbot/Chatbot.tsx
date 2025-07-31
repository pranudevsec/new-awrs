import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import dgis from '../../assets/dgislogo.png';

export function Chatbot() {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you?' }
  ]);

  const sendMessage = async () => {
    try {
      setIsLoading(true);
      if (input.trim() === '') return;
      const message = input;
      setMessages((prev) => [...prev, { from: 'user', text: input }]);
      setInput('');
      const response = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/api/chatbot/retrieve`,
        { question: message },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessages((prev) => [...prev, { from: 'bot', text: response.data.answer }]);
    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  return (
    <>
      {chatOpen && (
        <div
          className="position-fixed m-5 border rounded shadow bg-white"
          style={{
            width: '360px',
            maxHeight: '500px',
            height: 'auto',
            zIndex: 1050,
            left: '200px',
            bottom: '50px'
          }}
        >
          {/* Header */}
          <div className="text-white d-flex justify-content-between align-items-center px-3 py-2 rounded-top" style={{ backgroundColor: 'var(--blue-primary-clr)' }}>
            <strong>Chat with Us</strong>
            <button
              className="btn-close btn-close-white btn-sm"
              onClick={() => setChatOpen(false)}
            />
          </div>

          {/* Messages */}
          <div className="p-3 overflow-auto" style={{ maxHeight: '300px' }}>
            {messages.map((msg) => (
              <div
                key={msg.text}
                className={`mb-2 p-2 rounded ${msg.from === 'user'
                  ? 'text-white text-end ms-auto'
                  : 'text-white bg-secondary text-start me-auto'
                  }`}
                style={{ maxWidth: '80%', backgroundColor: 'var(--blue-primary-clr)' }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-top p-2 d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm "
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            {isLoading ? (
              <div className="d-flex justify-content-center align-items-center p-3">
                <div className="spinner-border text-primary" aria-hidden="true" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>

            ) : (
              <button
                className="btn btn-sm text-white"
                style={{ backgroundColor: 'var(--blue-primary-clr)' }}
                onClick={sendMessage}
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className="btn text-white  position-fixed bottom-0  m-5 rounded-pill shadow"
        onClick={() => setChatOpen(!chatOpen)}
        style={{ zIndex: 1050, backgroundColor: 'var(--blue-primary-clr)', left: '1.5rem' }}
      >
        <span className="d-flex align-items-center gap-2">
          <img
            src={dgis}
            alt="DGIS Logo"
            style={{ width: '24px', height: '24px' }}
          />
          DGIS Assist
        </span>
      </button>
    </>
  );
}
