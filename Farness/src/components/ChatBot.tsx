import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader, ArrowRight } from 'lucide-react';
import { FARNESS_SYSTEM_PROMPT } from '../utils/farnessContext';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  suggestions?: string[];
}

interface ScheduleData {
  name: string;
  email: string;
  company: string;
  phone: string;
  industry: string;
  challenge: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const industries = ['Mining', 'Energy & Utilities', 'Infrastructure', 'Industrial Facilities'];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey! 👋 I'm Farness Bot. I help companies understand how autonomous drone technology can transform their industrial operations.

What would you like to know?`,
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        'What is Farness?',
        'Which industry are you in?',
        'How does it work?',
        'Schedule a demo',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<keyof ScheduleData | null>(null);
  const [scheduleData, setScheduleData] = useState<Partial<ScheduleData>>({});
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [detectedIndustry, setDetectedIndustry] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getSuggestedQuestions = (userMessage: string): string[] => {
    const lower = userMessage.toLowerCase();

    if (lower.includes('mining') || lower.includes('stockpile')) {
      return [
        'How fast is stockpile surveying?',
        'What are the safety benefits?',
        'How much can we save annually?',
        'Schedule a demo for mining',
      ];
    }
    if (lower.includes('energy') || lower.includes('pipeline') || lower.includes('solar')) {
      return [
        'What detection accuracy do you have?',
        'Can you monitor 24/7?',
        'How does cost compare to helicopters?',
        'Schedule a demo for energy',
      ];
    }
    if (lower.includes('infrastructure') || lower.includes('bridge') || lower.includes('dam')) {
      return [
        'How do you eliminate access risk?',
        'What about inspection accuracy?',
        'How much faster than traditional methods?',
        'Schedule a demo for infrastructure',
      ];
    }
    if (lower.includes('industrial') || lower.includes('tank') || lower.includes('facility')) {
      return [
        'Can you work without shutdowns?',
        'How safe is confined space access?',
        'What is the typical ROI?',
        'Schedule a demo for industrial',
      ];
    }

    return [
      'Tell me about specific industries',
      'How accurate is your technology?',
      'What\'s the ROI timeline?',
      'Schedule a demo',
    ];
  };

  const callGroqAPI = async (userMessage: string, history: Array<{ role: string; content: string }>) => {
    try {
      const systemPromptWithContext = `${FARNESS_SYSTEM_PROMPT}

## CURRENT CONVERSATION CONTEXT
User's detected industry: ${detectedIndustry || 'Not yet determined'}
Messages in conversation: ${history.length}

## INSTRUCTION FOR THIS RESPONSE
- Provide a concise response (2-3 sentences max)
- End with a relevant follow-up question or suggestion
- Stay factual - only mention what's in the ground truth
- If user asks about scheduling, acknowledge but don't process - you'll guide them to the form`;

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
              content: systemPromptWithContext,
            },
            ...history,
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.5,
          max_tokens: 512,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error);
      return `I'm having trouble connecting right now. Please contact our team directly:
📞 +1 (555) 123-4567
📧 hello@farness.com`;
    }
  };

  const handleScheduleSubmit = async () => {
    if (scheduleData.name && scheduleData.email && scheduleData.company && scheduleData.phone && scheduleData.industry) {
      const bookingData = {
        ...scheduleData,
        timestamp: new Date().toISOString(),
      };

      console.log('Demo booked:', bookingData);

      const confirmMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `✅ Perfect! Your demo is scheduled!

📝 Name: ${scheduleData.name}
📧 Email: ${scheduleData.email}
🏢 Company: ${scheduleData.company}
🏭 Industry: ${scheduleData.industry}
📞 Phone: ${scheduleData.phone}
${scheduleData.challenge ? `\n💭 Challenge: ${scheduleData.challenge}` : ''}

Our team will contact you within 24 hours to confirm the demo time. You should also see a confirmation email shortly.

Is there anything else you'd like to know about Farness before your demo?`,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: [
          'Tell me more about AI agents',
          'How does edge computing work?',
          'What drones do you use?',
          'Back to main menu',
        ],
      };

      setMessages((prev) => [...prev, confirmMsg]);
      setScheduleStep(null);
      setScheduleData({});
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

    // Detect industry from message
    const lower = messageText.toLowerCase();
    if (lower.includes('mining')) setDetectedIndustry('Mining');
    else if (lower.includes('energy') || lower.includes('pipeline')) setDetectedIndustry('Energy & Utilities');
    else if (lower.includes('infrastructure') || lower.includes('bridge')) setDetectedIndustry('Infrastructure');
    else if (lower.includes('industrial') || lower.includes('tank')) setDetectedIndustry('Industrial Facilities');

    // Handle scheduling flow
    if (scheduleStep) {
      if (scheduleStep === 'name') {
        setScheduleData((prev) => ({ ...prev, name: messageText }));
        setScheduleStep('email');
        const nextMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'What\'s your work email address?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, nextMsg]);
        setIsLoading(false);
        return;
      } else if (scheduleStep === 'email') {
        if (!validateEmail(messageText)) {
          const invalidMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: 'Please enter a valid email address (e.g., name@company.com)',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, invalidMsg]);
          setIsLoading(false);
          return;
        }
        setScheduleData((prev) => ({ ...prev, email: messageText }));
        setScheduleStep('company');
        const nextMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'What\'s your company name?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, nextMsg]);
        setIsLoading(false);
        return;
      } else if (scheduleStep === 'company') {
        setScheduleData((prev) => ({ ...prev, company: messageText }));
        setScheduleStep('phone');
        const nextMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'What\'s your phone number? (include country code)',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, nextMsg]);
        setIsLoading(false);
        return;
      } else if (scheduleStep === 'phone') {
        setScheduleData((prev) => ({ ...prev, phone: messageText }));
        setScheduleStep('industry');
        const nextMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Which industry best matches your operation?',
          sender: 'bot',
          timestamp: new Date(),
          suggestions: industries,
        };
        setMessages((prev) => [...prev, nextMsg]);
        setIsLoading(false);
        return;
      } else if (scheduleStep === 'industry') {
        if (!industries.includes(messageText)) {
          const invalidMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: `Please select one of: ${industries.join(', ')}`,
            sender: 'bot',
            timestamp: new Date(),
            suggestions: industries,
          };
          setMessages((prev) => [...prev, invalidMsg]);
          setIsLoading(false);
          return;
        }
        setScheduleData((prev) => ({ ...prev, industry: messageText }));
        setScheduleStep('challenge');
        const nextMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'What\'s your biggest operational challenge right now? (optional - press skip or just describe it)',
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Skip this', 'Safety concerns', 'Cost reduction', 'Operational efficiency'],
        };
        setMessages((prev) => [...prev, nextMsg]);
        setIsLoading(false);
        return;
      } else if (scheduleStep === 'challenge') {
        if (messageText.toLowerCase() !== 'skip this') {
          setScheduleData((prev) => ({ ...prev, challenge: messageText }));
        }
        setScheduleStep(null);
        await handleScheduleSubmit();
        setIsLoading(false);
        return;
      }
    }

    // Check if user wants to schedule
    if (messageText.toLowerCase().includes('schedule') || messageText.toLowerCase().includes('demo')) {
      setScheduleStep('name');
      const scheduleMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Great! Let\'s get you scheduled. What\'s your first name?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, scheduleMsg]);
      setIsLoading(false);
      return;
    }

    // Regular conversation - call LLM
    const updatedHistory = [...conversationHistory, { role: 'user', content: messageText }];
    const botResponse = await callGroqAPI(messageText, conversationHistory);

    setConversationHistory([
      ...updatedHistory,
      { role: 'assistant', content: botResponse },
    ]);

    const suggestions = getSuggestedQuestions(messageText);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
      suggestions: suggestions,
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

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
            style={{ height: '650px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Farness Bot</h3>
                <p className="text-sm text-blue-100">Always ready to help</p>
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
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

            {/* Suggestions */}
            {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && messages[messages.length - 1].suggestions && !isLoading && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900">
                <div className="flex flex-wrap gap-2">
                  {messages[messages.length - 1].suggestions?.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isLoading}
                      className="text-xs bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-full transition-colors disabled:opacity-50 border border-blue-200 dark:border-blue-800 font-medium whitespace-nowrap"
                    >
                      {suggestion}
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
                  placeholder={scheduleStep ? 'Your response...' : 'Ask me anything...'}
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
