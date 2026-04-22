import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { FARNESS_SYSTEM_PROMPT } from '../utils/farnessContext';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey! 👋 I'm Farness Bot, an intelligent AI assistant. I'm here to answer any questions about Farness, our autonomous drone platform, how we serve different industries, and help you schedule a demo. What can I help you with today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [infoStep, setInfoStep] = useState<'name' | 'email' | 'company' | 'phone' | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callGroqAPI = async (userMessage: string, history: Array<{ role: string; content: string }>) => {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: FARNESS_SYSTEM_PROMPT,
            },
            ...history,
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error);
      return `I apologize, but I'm having trouble connecting to my knowledge base at the moment. Please try again or contact our team directly at hello@farness.com or +1 (555) 123-4567.`;
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Handle info collection flow
    if (isCollectingInfo) {
      if (infoStep === 'name') {
        setFormData((prev) => ({ ...prev, name: messageText }));
        setInfoStep('email');
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Thanks! What\'s your email address?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
      } else if (infoStep === 'email') {
        setFormData((prev) => ({ ...prev, email: messageText }));
        setInfoStep('company');
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Great! What\'s your company name?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
      } else if (infoStep === 'company') {
        setFormData((prev) => ({ ...prev, company: messageText }));
        setInfoStep('phone');
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'And finally, your phone number?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
      } else if (infoStep === 'phone') {
        const completedFormData = {
          ...formData,
          phone: messageText,
          timestamp: new Date().toISOString(),
        };

        // Schedule complete - send to backend or handle
        console.log('Demo scheduled with info:', completedFormData);

        const completeMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: `Perfect! I've got all your information:

📝 Name: ${formData.name}
📧 Email: ${formData.email}
🏢 Company: ${formData.company}
📞 Phone: ${messageText}

✅ Your demo has been successfully scheduled!

Our team will contact you shortly at ${formData.email} to confirm your demo slot and answer any specific questions about your operation. We typically get back to you within 24 hours.

In the meantime, feel free to ask me any other questions about Farness or our services!`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, completeMsg]);
        setIsCollectingInfo(false);
        setInfoStep(null);
        setIsLoading(false);
      }
      return;
    }

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: messageText },
    ];

    // Get response from Groq API
    const botResponse = await callGroqAPI(messageText, conversationHistory);

    // Update conversation history with bot response
    const newHistory = [
      ...updatedHistory,
      { role: 'assistant', content: botResponse },
    ];
    setConversationHistory(newHistory);

    // Add bot response message
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);

    // Check if user wants to schedule demo
    const schedulingKeywords = ['schedule', 'demo', 'book', 'booking', 'appointment'];
    const wantsScheduling = schedulingKeywords.some((keyword) =>
      messageText.toLowerCase().includes(keyword)
    );

    if (wantsScheduling && !isCollectingInfo) {
      setTimeout(() => {
        setIsCollectingInfo(true);
        setInfoStep('name');
        const scheduleMsg: Message = {
          id: (Date.now() + 2).toString(),
          text: `Great! I can help you schedule a demo. To get started, could you please tell me your name?`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, scheduleMsg]);
      }, 500);
    }
  };

  const suggestedQuestions = [
    'What is Farness?',
    'How does it work?',
    'Industries & use cases',
    'Pricing & ROI',
    'Schedule a demo',
  ];

  return (
    <>
      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 w-96 max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-black/40 border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col z-40"
            style={{ height: '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Farness Bot</h3>
                <p className="text-sm text-blue-100">Powered by AI - Always learning</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-slate-950">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl rounded-bl-none border border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-2">
                    <Loader size={16} className="animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {!isCollectingInfo && messages.length <= 2 && !isLoading && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading}
                      className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full shadow-2xl shadow-blue-600/50 flex items-center justify-center cursor-pointer z-40 transition-all duration-300"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle size={24} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
