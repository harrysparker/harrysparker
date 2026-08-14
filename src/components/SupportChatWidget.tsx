import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, PhoneCall, AlertTriangle, ShieldCheck, CheckCheck, Clock, User, Sparkles, MapPin, Paperclip, ChevronDown, Headset } from 'lucide-react';
import { Order } from '../types';

interface SupportChatWidgetProps {
  orders?: Order[];
}

interface ChatMessage {
  id: string;
  sender: 'client' | 'agent' | 'system';
  agentName?: string;
  text: string;
  timestamp: string;
  isUrgent?: boolean;
}

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({ orders = [] }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<string>(
    orders.length > 0 ? orders[0].trackingNumber : 'IVR-84920'
  );
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'agent',
      agentName: 'Aïcha - Support Client Ivoire Delivery',
      text: 'Bonjour ! Je suis Aïcha du Support Client Urgent Ivoire Delivery 🇨🇮. Avez-vous un souci ou un retard sur votre livraison ? Je suis là pour vous aider en direct !',
      timestamp: '15:35',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const quickPrompts = [
    '🚨 Retard de livraison urgent',
    '📍 Le livreur ne trouve pas mon adresse',
    '📞 Demande de rappel téléphonique',
    '📦 Colis endommagé ou incomplet',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'client',
      text: text,
      timestamp: time,
      isUrgent: text.includes('🚨') || text.toLowerCase().includes('urgent'),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Simulate Agent Intelligent / Human Support Response
    setTimeout(() => {
      let responseText = "J'ai bien noté votre signalement concernant le colis " + selectedOrderTracking + ". Je contacte le livreur sur le terrain via le réseau GPS national et je reviens vers vous dans un instant.";
      
      const lower = text.toLowerCase();
      if (lower.includes('retard') || lower.includes('🚨')) {
        responseText = "🚨 Urgence prise en compte pour " + selectedOrderTracking + " ! J'ai recontacté le livreur en direct. Son itinéraire GPS est ajusté en priorité Express. Merci pour votre patience !";
      } else if (lower.includes('adresse') || lower.includes('📍')) {
        responseText = "📍 Coordonnées mises à jour avec le livreur ! Vous pouvez vérifier son emplacement en direct sur la carte interactive de votre espace commande.";
      } else if (lower.includes('rappel') || lower.includes('📞')) {
        responseText = "📞 Notre superviseur de la régie inter-villes va vous appeler sur votre numéro mobile dans moins de 3 minutes.";
      } else if (lower.includes('endommagé') || lower.includes('📦')) {
        responseText = "📦 Nous sommes désolés pour cet incident. Votre livraison est couverte par notre garantie Ivoire Delivery. Un agent dédié prend en charge l'échange immédiat.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'agent_' + Date.now(),
          sender: 'agent',
          agentName: 'Aïcha - Support Client Ivoire Delivery',
          text: responseText,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Floating Widget Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative bg-[#009E49] hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-3 border-2 border-white"
        >
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF8C00] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
              {unreadCount}
            </span>
          )}

          <div className="relative">
            <Headset className="w-6 h-6 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-white animate-ping"></span>
          </div>

          <div className="hidden sm:flex flex-col text-left pr-1">
            <span className="text-xs font-black leading-tight text-white">Support Client 24/7</span>
            <span className="text-[10px] text-emerald-100 font-bold">Problèmes Urgents</span>
          </div>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="bg-white border border-gray-200 w-[92vw] sm:w-[390px] h-[520px] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#009E49] to-emerald-700 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white font-black text-lg">
                  <Headset className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-emerald-800"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white">Support Urgent Live</h4>
                  <span className="bg-emerald-800/80 text-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">En Ligne</span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium">Réponse directe & suivi colis</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selected Order Bar */}
          <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center justify-between text-xs font-bold text-orange-950">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>Colis concerné :</span>
            </div>
            <select
              value={selectedOrderTracking}
              onChange={e => setSelectedOrderTracking(e.target.value)}
              className="bg-white border border-orange-200 rounded-lg px-2 py-0.5 text-xs font-black text-[#111827] focus:outline-none cursor-pointer"
            >
              {orders.length > 0 ? (
                orders.map(o => (
                  <option key={o.id} value={o.trackingNumber}>
                    {o.trackingNumber} ({o.destinationCityName})
                  </option>
                ))
              ) : (
                <option value="IVR-84920">IVR-84920 (Bouaké)</option>
              )}
            </select>
          </div>

          {/* Quick Issue Chips */}
          <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="bg-white hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 font-bold border border-gray-200 px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9FAFB] scrollbar-thin">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'}`}
              >
                {msg.sender === 'agent' && (
                  <span className="text-[10px] text-gray-500 font-bold mb-1 flex items-center gap-1 pl-1">
                    <ShieldCheck className="w-3 h-3 text-[#009E49]" />
                    {msg.agentName}
                  </span>
                )}

                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                    msg.sender === 'client'
                      ? 'bg-[#009E49] text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[9px] mt-1 text-right font-mono ${
                      msg.sender === 'client' ? 'text-emerald-100' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium p-2 bg-white rounded-2xl border border-gray-100 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#FF8C00] animate-spin" />
                <span>L'agent Aïcha rédige une réponse...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Emergency Hotline Banner */}
          <div className="bg-gray-100 border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-600">
            <span className="font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FF8C00]" />
              Ligne Urgence Directe :
            </span>
            <a
              href="tel:+2250700000000"
              className="text-[#009E49] font-black hover:underline flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" />
              +225 07 00 00 00 00
            </a>
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Écrivez votre message d'urgence..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#009E49]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="bg-[#009E49] hover:bg-emerald-600 disabled:opacity-40 text-white p-2.5 rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
