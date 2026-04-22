import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, Mail, MapPin } from 'lucide-react';

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

const botResponses: { [key: string]: string } = {
  'what is farness': `Farness is an autonomous drone platform powered by AI. We help industrial companies inspect pipelines, mines, infrastructure, and facilities without putting crews at risk. Our drones can operate 24/7, deliver survey-grade accuracy, and integrate with your existing workflows.`,

  'how does it work': `Our AI-powered drones autonomously:
1. Plan missions from natural language commands
2. Adapt in real-time to environmental changes
3. Analyze imagery with deep learning (thermal, visual, LiDAR)
4. Deliver actionable results instantly
All processing happens on-board—no cloud dependency needed.`,

  'what can you inspect': `We handle:
• Pipelines (leak detection, corrosion mapping)
• Stockpiles (volumetric analysis, mining surveys)
• Infrastructure (bridges, dams, towers, roads)
• Industrial facilities (tanks, flare stacks, confined spaces)
• Power lines & transmission towers
• Solar & wind farms
• Mining sites & quarries`,

  'what industries': `We serve:
🏔️ Mining - Stockpile analysis & haul road monitoring
⚡ Energy & Utilities - Pipeline & grid inspection
🏢 Infrastructure - Bridges, dams, roads, construction
🏭 Industrial Facilities - Tank & facility monitoring`,

  'how much does it cost': `Pricing depends on your specific needs—site size, frequency, complexity. Schedule a consultation and we'll provide a custom quote. Demo scheduling is free, and we usually see ROI within 6-12 months.`,

  'what about safety': `Safety is core to Farness:
✓ Eliminates crew exposure to hazardous zones
✓ Autonomous operation with built-in failsafes
✓ Real-time monitoring and alerts
✓ Full compliance documentation
✓ Insurance-backed operations`,

  'how accurate is it': `Our system delivers:
• ±2cm accuracy (survey-grade precision)
• 99.2% anomaly detection rate
• Thermal + visual analysis simultaneously
• Real-time defect classification`,

  'do you offer training': `Yes! We provide:
• Onboarding training for your team
• Operator certification
• Ongoing technical support
• Custom workflow integration
Ask our team about training packages.`,

  'how long does setup take': `Typically 2-4 weeks:
Week 1: Site assessment & planning
Week 2: Equipment deployment & calibration
Week 3-4: Training & integration
Emergency deployments available for critical operations.`,

  'contact us': `📞 Phone: +1 (555) 123-4567
📧 Email: hello@farness.com
🌍 Website: www.farness.com
💬 Chat with us right here!

Or schedule a consultation below—let's discuss your specific needs.`,

  'schedule a demo': `I'd love to help! To book your demo, I can either:
1. Get your info and schedule it for you right now
2. Let you book directly using our calendar

Which would you prefer?`,

  'yes schedule me': `Perfect! I'll collect your info and get you scheduled.

What's your name?`,

  'thanks': `You're welcome! Any other questions about Farness?`,

  'hello': `Hey there! 👋 I'm Farness Bot. I can help you with:
• What Farness does
• How our technology works
• Which industries we serve
• Pricing & ROI
• Safety & accuracy
• Scheduling a demo
• Contact information

What would you like to know?`,

  'hi': `Hey! 👋 I'm Farness Bot. How can I help?
Ask me about our technology, industries, pricing, or schedule a demo!`,

  'help': `I'm here to help! You can ask me about:
• What is Farness?
• How does it work?
• What can you inspect?
• Industries we serve
• Cost & pricing
• Safety features
• Accuracy specs
• Training & support
• Demo scheduling
• Contact information

What would you like to know?`,

  'default': `Great question! To get more detailed information or discuss your specific needs, I'd recommend scheduling a consultation with our team. They can provide personalized solutions.

Would you like to schedule a demo?`,
};

const findResponse = (userInput: string): string => {
  const input = userInput.toLowerCase().trim();

  for (const [key, response] of Object.entries(botResponses)) {
    if (input.includes(key) || key.includes(input)) {
      return response;
    }
  }

  return botResponses['default'];
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hey! 👋 I'm Farness Bot. I'm here to help answer questions about Farness, what we do, and how we can help your operations. How can I assist you today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [infoStep, setInfoStep] = useState<'name' | 'email' | 'company' | 'phone' | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Handle info collection flow
    if (isCollectingInfo) {
      if (infoStep === 'name') {
        setFormData((prev) => ({ ...prev, name: messageText }));
        setInfoStep('email');
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Great! What\'s your email address?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else if (infoStep === 'email') {
        setFormData((prev) => ({ ...prev, email: messageText }));
        setInfoStep('company');
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: 'What\'s your company name?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
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
      } else if (infoStep === 'phone') {
        setFormData((prev) => ({ ...prev, phone: messageText }));

        // Schedule complete
        const completeMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: `Perfect! I've got your info:
📝 Name: ${formData.name}
📧 Email: ${messageText}
🏢 Company: ${formData.company}
📞 Phone: ${messageText}

Our team will contact you shortly to schedule your demo. You can also scroll down and book directly in our calendar. Thanks for your interest in Farness!`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, completeMsg]);
        setIsCollectingInfo(false);
        setInfoStep(null);
      }
      return;
    }

    // Regular conversation flow
    const response = findResponse(messageText);

    // Check if user wants to schedule
    const wantsSchedule = messageText.toLowerCase().includes('schedule') ||
                         messageText.toLowerCase().includes('demo') ||
                         messageText.toLowerCase().includes('book');

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);

    // If asking about scheduling or yes, start collecting info
    if (wantsSchedule && !messageText.toLowerCase().includes('yes schedule')) {
      setTimeout(() => {
        const followUp: Message = {
          id: (Date.now() + 2).toString(),
          text: 'Would you like me to collect your information and get you scheduled? Just say "yes schedule me"',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, followUp]);
      }, 500);
    } else if (messageText.toLowerCase().includes('yes schedule')) {
      setTimeout(() => {
        setIsCollectingInfo(true);
        setInfoStep('name');
        const scheduleStart: Message = {
          id: (Date.now() + 2).toString(),
          text: 'Awesome! Let\'s get you scheduled. What\'s your name?',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, scheduleStart]);
      }, 500);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const quickQuestions = [
    'What is Farness?',
    'How does it work?',
    'What industries?',
    'Schedule a demo',
    'Contact us',
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Farness Bot</h3>
                <p className="text-sm text-blue-100">Always here to help</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700/50 p-2 rounded-lg transition-colors"
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
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {!isCollectingInfo && messages.length <= 2 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
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
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
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
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
