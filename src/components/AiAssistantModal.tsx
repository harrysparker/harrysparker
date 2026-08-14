import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, HelpCircle } from 'lucide-react';

interface AiAssistantModalProps {
  onClose: () => void;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Bonjour ! Je suis l'assistant AI d'Ivoire Delivery. Posez-moi vos questions sur nos tarifs, les livraisons inter-villes (Bouaké, Korhogo, Yamoussoukro, Daloa, San-Pédro, Man, Abidjan), le code OTP de sécurité ou les paiements Wave / Mobile Money !",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: data.answer || "Je reste à votre disposition pour toute information complémentaire sur Ivoire Delivery.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "Je suis désolé, je rencontre une petite difficulté de connexion. Vous pouvez consulter nos tarifs directement dans la section Dispatch.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-gray-100 w-full max-w-lg rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 relative flex flex-col h-[520px] max-h-[90vh] text-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#009E49] flex items-center justify-center text-white font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-['Outfit'] text-[#111827]">Assistant Intelligent Ivoire Delivery</h3>
              <p className="text-[10px] text-[#009E49] font-black">Propulsé par Gemini 3.6 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Prompt Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {[
            'Comment fonctionne le regroupement d\'articles ?',
            'Quel est le délai entre Bouaké et Korhogo ?',
            'Comment valider le code OTP ?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium border border-gray-200 px-3 py-1 rounded-xl whitespace-nowrap cursor-pointer transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 scrollbar-none">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 text-xs ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FF8C00] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-[#FF8C00] text-white font-medium shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <div className={`text-[9px] mt-1 ${m.sender === 'user' ? 'text-orange-100' : 'text-gray-400'} text-right`}>
                  {m.time}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#009E49] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="text-xs text-gray-500 flex items-center gap-2 p-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FF8C00] animate-spin" />
              <span>Analyse de votre demande...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question sur la livraison..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#FF8C00]"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuestion.trim()}
            className="bg-[#009E49] hover:bg-emerald-600 disabled:opacity-50 text-white p-2.5 rounded-2xl transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
