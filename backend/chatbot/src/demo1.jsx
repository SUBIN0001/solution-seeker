import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Globe, Download, Database, Upload } from 'lucide-react';

const Demo1 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [collegeData, setCollegeData] = useState('');
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataInput, setDataInput] = useState('');
  const messagesEndRef = useRef(null);

  const languages = {
    en: 'English',
    hi: 'हिंदी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    bn: 'বাংলা',
    mr: 'मराठी'
  };

  const greetings = {
    en: 'Hello! I can help you with college information. Ask me anything!',
    hi: 'नमस्ते! मैं कॉलेज की जानकारी में आपकी मदद कर सकता हूं। मुझसे कुछ भी पूछें!',
    ta: 'வணக்கம்! கல்லூரி தகவல்களில் நான் உங்களுக்கு உதவ முடியும். என்னிடம் எதையும் கேளுங்கள்!',
    te: 'నమస్కారం! కళాశాల సమాచారంలో నేను మీకు సహాయం చేయగలను. నన్ను ఏదైనా అడగండి!',
    bn: 'হ্যালো! আমি কলেজ তথ্যে আপনাকে সাহায্য করতে পারি। আমাকে কিছু জিজ্ঞাসা করুন!',
    mr: 'नमस्कार! मी तुम्हाला महाविद्यालयाच्या माहितीत मदत करू शकतो. मला काहीही विचारा!'
  };

  const defaultData = `COLLEGE INFORMATION

About:
Example University is a premier institution established in 1990, offering quality education in various disciplines.

Courses Offered:
- B.Tech Computer Science - 4 years - ₹80,000/year
- B.Tech Electronics - 4 years - ₹75,000/year
- MBA - 2 years - ₹1,50,000/year
- BBA - 3 years - ₹60,000/year

Admission Process:
1. Online application (April 1 - May 31)
2. Entrance examination (June 15)
3. Personal interview (June 20-25)
4. Merit list announcement (July 1)

Scholarships:
- Merit Scholarship: Top 10% students get 50% fee waiver
- Sports Quota: 30% fee waiver
- Need-based: Family income <₹2 lakhs - 40% fee waiver

Facilities:
- Central Library with 50,000+ books
- Modern computer labs
- Separate hostels for boys and girls
- Sports complex
- Cafeteria

Contact:
Email: admissions@example.edu
Phone: +91-XXX-XXX-XXXX`;

  // Load on mount
  useEffect(() => {
    loadMessages();
    loadCollegeData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCollegeData = () => {
    // Try to load from storage, fallback to in-memory state
    try {
      if (window.storage && window.storage.get) {
        window.storage.get('college_data').then(result => {
          if (result && result.value) {
            setCollegeData(result.value);
            setDataInput(result.value);
          } else {
            setCollegeData(defaultData);
            setDataInput(defaultData);
          }
        }).catch(err => {
          console.log('Storage not available, using default data');
          setCollegeData(defaultData);
          setDataInput(defaultData);
        });
      } else {
        // Storage API not available
        setCollegeData(defaultData);
        setDataInput(defaultData);
      }
    } catch (error) {
      console.log('Using default data');
      setCollegeData(defaultData);
      setDataInput(defaultData);
    }
  };

  const loadMessages = async () => {
    try {
      if (!window.storage) {
        const greeting = {
          id: Date.now(),
          text: greetings[language],
          sender: 'bot',
          timestamp: Date.now(),
          language: language
        };
        setMessages([greeting]);
        return;
      }

      const result = await window.storage.list('chat:');
      if (result && result.keys && result.keys.length > 0) {
        const allMessages = [];
        for (const key of result.keys) {
          try {
            const msgResult = await window.storage.get(key);
            if (msgResult) {
              allMessages.push(JSON.parse(msgResult.value));
            }
          } catch (e) {
            console.log('Message not found:', key);
          }
        }
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(allMessages);
      } else {
        const greeting = {
          id: Date.now(),
          text: greetings[language],
          sender: 'bot',
          timestamp: Date.now(),
          language: language
        };
        setMessages([greeting]);
      }
    } catch (error) {
      console.log('No previous messages found');
      const greeting = {
        id: Date.now(),
        text: greetings[language],
        sender: 'bot',
        timestamp: Date.now(),
        language: language
      };
      setMessages([greeting]);
    }
  };

  const saveMessage = async (message) => {
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set(`chat:${message.id}`, JSON.stringify(message));
      }
    } catch (error) {
      console.log('Could not save message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: Date.now(),
      language: language
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    setInput('');
    setIsLoading(true);

    const context = messages.slice(-5).map(m => 
      `${m.sender}: ${m.text}`
    ).join('\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are a helpful college assistant chatbot. Answer student questions ONLY using the college information provided below.

COLLEGE DATA:
${collegeData}

Previous conversation:
${context}

Current language: ${languages[language]}

Student's question: ${input}

Instructions:
- Answer ONLY based on the college information provided above
- If information is not available, politely say "I don't have that specific information. Please contact the college office."
- Be friendly, helpful, and concise
- Respond in ${languages[language]}`
            }
          ]
        })
      });

      const data = await response.json();
      const botText = data.content.map(item => item.text || '').join('\n');

      const botMessage = {
        id: Date.now(),
        text: botText,
        sender: 'bot',
        timestamp: Date.now(),
        language: language
      };

      setMessages(prev => [...prev, botMessage]);
      await saveMessage(botMessage);
    } catch (error) {
      const errorMessage = {
        id: Date.now(),
        text: language === 'en' ? 'Sorry, I encountered an error. Please try again.' : 'क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा। कृपया पुन: प्रयास करें।',
        sender: 'bot',
        timestamp: Date.now(),
        language: language
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    }

    setIsLoading(false);
  };

  const handleSaveData = async () => {
    if (!dataInput.trim()) {
      alert('❌ Please enter some college data first!');
      return;
    }

    if (dataInput.length > 100000) {
      alert('❌ Data is too large (over 100,000 characters). Please reduce the content.');
      return;
    }

    try {
      // Update the in-memory state first (this always works)
      setCollegeData(dataInput);
      
      // Try to save to storage if available
      if (window.storage && window.storage.set) {
        try {
          await window.storage.set('college_data', dataInput);
          console.log('Data saved to storage');
        } catch (storageError) {
          console.log('Storage save failed, but data is loaded in memory:', storageError);
        }
      }
      
      setShowDataModal(false);
      alert('✅ College data updated successfully! The chatbot will now use this information.\n\nNote: Data is loaded in the current session. You may need to re-enter it if you refresh the page.');
    } catch (error) {
      console.error('Error:', error);
      alert('⚠️ Data has been loaded for this session, but could not be saved permanently. You may need to re-enter it after refreshing the page.');
      setCollegeData(dataInput);
      setShowDataModal(false);
    }
  };

  const exportChats = async () => {
    try {
      const dataStr = JSON.stringify(messages, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Error exporting chats:', error);
    }
  };

  const clearChats = async () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      try {
        if (window.storage) {
          const result = await window.storage.list('chat:');
          if (result && result.keys) {
            for (const key of result.keys) {
              await window.storage.delete(key);
            }
          }
        }
        setMessages([{
          id: Date.now(),
          text: greetings[language],
          sender: 'bot',
          timestamp: Date.now(),
          language: language
        }]);
      } catch (error) {
        console.error('Error clearing chats:', error);
        setMessages([{
          id: Date.now(),
          text: greetings[language],
          sender: 'bot',
          timestamp: Date.now(),
          language: language
        }]);
      }
    }
  };

  return (
    <>
      <div className="fixed bottom-0 right-0 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="m-6 w-16 h-16 bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center text-white"
          >
            <MessageSquare size={28} />
          </button>
        )}

        {isOpen && (
          <div className="m-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col">
            <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center font-bold">
                  CB
                </div>
                <div>
                  <h3 className="font-semibold">College Assistant</h3>
                  <p className="text-xs text-indigo-200">Trained on college data</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-indigo-700 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gray-600" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDataModal(true)}
                  className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1"
                  title="Manage training data"
                >
                  <Database size={14} />
                  Train
                </button>
                <button
                  onClick={exportChats}
                  className="text-gray-600 hover:text-indigo-600 p-1"
                  title="Export chat history"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={clearChats}
                  className="text-xs text-gray-600 hover:text-red-600 px-2 py-1 rounded"
                  title="Clear chat history"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send
              </p>
            </div>
          </div>
        )}
      </div>

      {showDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={24} />
                <h2 className="text-xl font-semibold">Train Your Chatbot</h2>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="hover:bg-indigo-700 p-1 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 bg-blue-50 border-b">
              <h3 className="font-semibold text-blue-900 mb-2">How to train your chatbot:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copy text content from your college website (courses, fees, facilities, etc.)</li>
                <li>Paste it in the text area below</li>
                <li>Click "Save & Train" - the bot will immediately use this information</li>
                <li>Test by asking questions in the chat!</li>
              </ol>
              <p className="text-xs text-blue-700 mt-2">
                💡 Tip: Keep it under 50,000 characters. Use clear headings like "COURSES:", "FEES:", etc.
              </p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                placeholder="Paste your college website content here...

Example:

COURSES:
- B.Tech Computer Science - 4 years - ₹80,000/year
- MBA - 2 years - ₹1,50,000/year

FEES:
B.Tech: ₹80,000 per year
MBA: ₹1,50,000 per year

ADMISSION:
- Application: April-May
- Entrance: June 15

FACILITIES:
Library, Labs, Hostel, Sports Complex

CONTACT:
Email: info@college.edu
Phone: +91-XXX-XXXX"
                className="w-full h-96 border-2 border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Characters: {dataInput.length.toLocaleString()} {dataInput.length > 50000 ? '⚠️ Consider reducing' : '✓'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-lg">
              <div className="text-xs text-gray-600">
                ℹ️ Data works immediately in this session
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDataModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveData}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Save & Train
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Demo1;