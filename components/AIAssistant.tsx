
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ArrowRight, Zap } from 'lucide-react';
import { askOpenRouterAssistant } from '../services/openRouterService';
import { ChatMessage } from '../types';
import { Link } from 'react-router-dom';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // Regex to match [Text](/url)
  const parts = content.split(/(\[.*?\]\(.*?\))/g);

  return (
    <pre className="whitespace-pre-wrap font-inherit">
      {parts.map((part, i) => {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const text = match[1];
          const url = match[2];
          return (
            <Link
              key={i}
              to={url}
              className="text-blue-600 underline font-black hover:text-blue-800 transition-colors"
            >
              {text}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </pre>
  );
};

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What are AC vs DC breakers?",
    "Tell me about Solar Solutions",
    "Where is BrightSwitch located?",
    "Do you offer wholesale rates?"
  ];

  useEffect(() => {
    // Fetch a sample of products to give context to the AI
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), limit(30));
        const snap = await getDocs(q);
        const productList = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          category: d.data().category
        }));
        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products for AI context:", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant' as const,
      content: m.content
    }));

    // Pass the product list as context (simplified string)
    const productContext = products.length > 0
      ? "AVAILABLE REAL PRODUCTS (provide links like [Product Name](/product/ID)):\n" +
      products.map(p => `- ${p.name} (ID: ${p.id}, Category: ${p.category})`).join('\n')
      : "";

    const response = await askOpenRouterAssistant(textToSend, history, productContext);

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center border-4 border-white/20"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-80 sm:w-[400px] flex flex-col overflow-hidden border border-gray-100 h-[550px] max-h-[85vh] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 pt-12 pb-6 px-6 flex justify-between items-center text-white relative">
            <div className="flex items-center space-x-3 z-10">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner border border-white/10">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight block leading-none text-white">Electrical Advisor</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 block mt-1.5 opacity-90">Powered by BrightSwitch</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10 z-[20] shadow-lg"
              title="Close chat"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/50 admin-scroll" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Zap className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">How can I help you today?</h3>
                <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">Ask me about technical specs, safety guides, or find the perfect product for your project.</p>

                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-left px-5 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-between group"
                    >
                      {q} <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl ${m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-100'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                  }`}>
                  <div className="text-sm leading-relaxed font-medium">
                    {m.role === 'assistant' ? (
                      <MessageContent content={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-white flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 bg-gray-50 border-none rounded-[1.25rem] px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
              className="bg-blue-600 text-white p-4 rounded-[1.25rem] hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
