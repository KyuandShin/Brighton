'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { MessageSquare, Send, User, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Conversation {
  userId: string;
  userName: string;
  userImage: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null };
}

export default function MessagesPage() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationWith = searchParams.get('user');

  // Fetch conversations
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch('/api/messages', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setConversations(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Fetch conversation messages
  useEffect(() => {
    if (!conversationWith || !user?.id) return;
    setChatLoading(true);
    fetch(`/api/messages?conversationWith=${conversationWith}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMessages(data); })
      .catch(console.error)
      .finally(() => setChatLoading(false));
  }, [conversationWith, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!conversationWith || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: conversationWith, content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const selectedUser = conversations.find(c => c.userId === conversationWith);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-p-purple rounded-full w-fit">
          <MessageSquare size={12} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Messages</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-text-main">
          Your <span className="gradient-text">Messages</span>
        </h2>
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
          Chat with tutors and students.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 h-[65vh]">
        {/* Conversations List */}
        <div className="w-full md:w-72 shrink-0 bg-surface border-2 border-border rounded-[24px] overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">Conversations</h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-53px)]">
            {loading ? (
              <div className="p-6 text-center">
                <Loader2 size={20} className="animate-spin mx-auto text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-p-purple rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare size={20} className="text-primary" />
                </div>
                <p className="text-[10px] font-bold text-text-muted">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => router.push(`/dashboard/messages?user=${conv.userId}`)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-p-purple/30 transition-all border-b border-border/50 ${
                    conversationWith === conv.userId ? 'bg-p-purple/50' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-p-purple to-pink-300 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                    {conv.userName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-text-main truncate">{conv.userName}</p>
                    <p className="text-[9px] text-text-muted truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[7px] font-bold flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-surface border-2 border-border rounded-[24px] overflow-hidden flex flex-col">
          {conversationWith ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <button onClick={() => router.push('/dashboard/messages')} className="md:hidden p-1 hover:bg-p-purple rounded-lg">
                  <ArrowLeft size={16} className="text-text-muted" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-p-purple to-pink-300 flex items-center justify-center text-white text-[10px] font-black">
                  {selectedUser?.userName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                </div>
                <p className="text-xs font-black text-text-main">{selectedUser?.userName || 'User'}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={28} className="mx-auto text-text-muted mb-3 opacity-40" />
                    <p className="text-[10px] font-bold text-text-muted">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] p-3 rounded-2xl ${
                          isMine
                            ? 'bg-primary text-white rounded-tr-md'
                            : 'bg-p-purple/40 text-text-main rounded-tl-md'
                        }`}>
                          <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                          <p className={`text-[8px] mt-1 font-bold uppercase tracking-widest ${
                            isMine ? 'text-white/60' : 'text-text-muted'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface-elevated border-2 border-border rounded-xl px-4 py-2.5 text-sm font-medium text-text-main focus:outline-none focus:border-primary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-strong transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 bg-p-purple rounded-3xl flex items-center justify-center mx-auto">
                  <MessageSquare size={36} className="text-primary" />
                </div>
                <p className="text-sm font-black text-text-muted">Select a conversation</p>
                <p className="text-[10px] font-bold text-text-muted max-w-xs">
                  Choose a conversation from the left or start messaging a tutor from their profile.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}