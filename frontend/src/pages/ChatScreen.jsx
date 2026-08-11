import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, User, Bot, Loader2, LogOut, MessageSquare, Plus, Menu, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) navigate('/');
    else loadChatHistory();
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('userId', '==', user.uid), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const chats = [];
    querySnapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    setChatHistory(chats);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadSpecificChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages || []);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    
    const updatedMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      setMessages((prev) => [...prev, { role: 'ai', text: '' }]);

      const response = await fetch('https://nova-backend-jw9s.onrender.com/api/chat/ask/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiFullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value, { stream: true });
        aiFullResponse += chunkText;

        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = aiFullResponse;
          return newMsgs;
        });
      }

      const finalMessages = [...updatedMessages, { role: 'ai', text: aiFullResponse }];
      
      if (currentChatId) {
        await updateDoc(doc(db, 'chats', currentChatId), {
          messages: finalMessages,
          updatedAt: serverTimestamp()
        });
      } else {
        const newChatRef = await addDoc(collection(db, 'chats'), {
          userId: user.uid,
          title: userMsg.slice(0, 30) + '...',
          messages: finalMessages,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setCurrentChatId(newChatRef.id);
        loadChatHistory();
      }

    } catch (error) {
      setMessages((prev) => [...prev.slice(0, -1), { role: 'ai', text: 'Error: Connection failed to NovaAI servers.' }]);
    } finally {
      setLoading(false);
    }
  };

  const userAvatar = user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=6366f1&color=fff`;

  return (
    <div className="flex h-screen bg-[#050505] text-gray-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Sleek Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0a0a0c] border-r border-white/5 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl`}>
        <div className="p-5">
          <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3.5 px-4 transition-all duration-300 font-medium border border-white/10 group">
            <Sparkles size={18} className="text-indigo-400 group-hover:text-indigo-300" /> 
            <span>New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-3">Your History</p>
          {chatHistory.map((chat) => (
            <button 
              key={chat.id} 
              onClick={() => loadSpecificChat(chat)}
              className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl truncate transition-all duration-200 ${currentChatId === chat.id ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
            >
              <MessageSquare size={16} className="shrink-0 opacity-70" />
              <span className="truncate text-sm font-medium">{chat.title}</span>
            </button>
          ))}
        </div>

        <div className="p-5 border-t border-white/5 bg-[#0a0a0c]">
          <div className="flex items-center gap-3 mb-5 p-2 rounded-xl bg-white/5 border border-white/5">
            <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=6366f1&color=fff`; }} />
            <div className="truncate">
              <p className="text-sm font-bold text-gray-200 truncate">{user?.displayName || 'Nova User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'user@nova.ai'}</p>
            </div>
          </div>
          <button onClick={() => { auth.signOut(); navigate('/'); }} className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl transition-colors font-medium">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]">
        <header className="h-16 px-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between md:justify-end sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-400 hover:text-white p-2 bg-white/5 rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm hidden md:flex">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-semibold text-gray-300 text-xs tracking-wide">Nova Engine Active</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full pb-32 custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 md:px-0 flex flex-col pt-8">
            
            {/* Welcome Screen */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.4)] rotate-3">
                  <Bot size={48} className="text-white -rotate-3" />
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 mb-4 tracking-tight">
                  Hi, {user?.displayName?.split(' ')[0] || 'there'}
                </h2>
                <p className="text-lg text-gray-400 font-medium max-w-md">Experience the next generation of AI. Ask me anything, or drop some code to review.</p>
              </div>
            )}

            {/* Chat Messages */}
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex gap-4 max-w-[100%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    
                    {/* Avatars */}
                    <div className="shrink-0 mt-1">
                      {msg.role === 'user' ? (
                        <img src={userAvatar} alt="User" className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-lg" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                          <Bot size={20} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Message Bubbles */}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} min-w-0 w-full`}>
                      {msg.role === 'user' ? (
                        // User Bubble
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-5 py-3.5 rounded-3xl rounded-tr-sm shadow-[0_5px_20px_rgba(99,102,241,0.2)] text-[15px] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </div>
                      ) : (
                        // AI Bubble with Typography
                        <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 px-6 py-5 rounded-3xl rounded-tl-sm shadow-xl w-full">
                          {/* Added prose-ol and prose-ul classes for proper list rendering */}
                          <div className="prose prose-invert prose-base max-w-none prose-p:leading-relaxed prose-ol:list-decimal prose-ul:list-disc prose-li:my-1 prose-pre:p-0 prose-pre:bg-transparent prose-code:text-indigo-300">
                            <ReactMarkdown
                              components={{
                                code({node, inline, className, children, ...props}) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <div className="rounded-xl overflow-hidden my-5 bg-[#0d0d0f] border border-white/10 shadow-2xl">
                                      <div className="bg-white/5 px-4 py-2 text-xs text-gray-400 font-mono flex justify-between items-center border-b border-white/5">
                                          <span className="uppercase tracking-wider font-bold text-indigo-400">{match[1]}</span>
                                      </div>
                                      <SyntaxHighlighter
                                        {...props}
                                        children={String(children).replace(/\n$/, '')}
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '0.9rem' }}
                                      />
                                    </div>
                                  ) : (
                                    <code {...props} className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded-md text-sm font-mono border border-indigo-500/20">
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Thinking Animation */}
              {loading && messages[messages.length - 1]?.text === '' && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10">
                         <Bot size={20} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-[#111113]/80 backdrop-blur-xl border border-white/5 px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-2 w-24">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </main>

        {/* Floating Input Box */}
        <footer className="absolute bottom-0 left-0 right-0 p-4 md:px-8 md:pb-8 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto relative pointer-events-auto">
            <form onSubmit={handleSend} className="relative flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl group">
              {/* Glowing animated border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-focus-within:opacity-50 transition-opacity blur-sm"></div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Ask NovaAI anything..."
                className="w-full relative z-10 bg-[#0a0a0c]/90 backdrop-blur-2xl border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none min-h-[60px] max-h-40 overflow-y-auto custom-scrollbar text-[15px]"
                rows="1"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute z-20 right-2.5 bottom-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl w-10 h-10 flex items-center justify-center transition-all shadow-md"
              >
                <Send size={18} className={(loading || !input.trim()) ? '' : 'ml-0.5'} />
              </button>
            </form>
            <div className="text-center mt-3 text-[11px] text-gray-500 font-medium tracking-wide">
              NovaAI can make mistakes. Built with Django & React.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}