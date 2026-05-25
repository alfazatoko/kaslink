import React, { useState, useRef, useEffect } from 'react';
import Modal from '../Common/Modal';
import { chatWithGemini, isGeminiReady } from '../../services/gemini';
import { Sparkles, SendHorizontal, Bot, User, AlertCircle } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Halo! Saya asisten AI KINK. Ada yang bisa saya bantu?\n\nContoh pertanyaan:\n- Bagaimana cara mencatat transaksi?\n- Apa itu BANK_OUT?\n- Tips pembukuan harian' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!isGeminiReady()) {
      setMessages(prev => [...prev, 
        { role: 'user', text: input.trim() },
        { role: 'assistant', text: '⚠️ Gemini belum dikonfigurasi. Masukkan API Key di menu Pengaturan > AI Asisten (Gemini).' }
      ]);
      setInput('');
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const reply = await chatWithGemini(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `❌ ${err.message}` }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🤖 AI Asisten KINK">
      <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', padding: '5px 0' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '8px',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: msg.role === 'user' ? 'var(--accent)' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="var(--text)" />}
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : '#f1f5f9',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={14} color="var(--text)" />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: '#f1f5f9', fontSize: '13px' }}>
                <span style={{ display: 'inline-flex', gap: '4px' }}>
                  <span style={{ animation: 'bounce 1.4s infinite' }}>●</span>
                  <span style={{ animation: 'bounce 1.4s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'bounce 1.4s infinite 0.4s' }}>●</span>
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Tanya sesuatu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '14px' }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              width: '46px', height: '46px', borderRadius: '14px',
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: 'white', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (!input.trim() || loading) ? 0.5 : 1,
            }}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </Modal>
  );
};

export default AiAssistantModal;
