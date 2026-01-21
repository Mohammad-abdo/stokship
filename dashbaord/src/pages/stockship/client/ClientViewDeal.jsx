import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealApi, negotiationApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, User, Store } from 'lucide-react';

export default function ClientViewDeal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const messagesEndRef = useRef(null);
  
  const [deal, setDeal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDealData();
    const interval = setInterval(fetchMessages, 10000); // Polling for messages
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDealData = async () => {
    try {
      setLoading(true);
      const [dealRes, msgsRes] = await Promise.all([
        dealApi.getDealById(id),
        negotiationApi.getMessages(id)
      ]);
      setDeal(dealRes.data?.data || dealRes.data);
      setMessages(msgsRes.data?.data || msgsRes.data || []);
    } catch (error) {
       console.error("Error loading deal:", error);
       showToast.error("Failed to load deal details");
    } finally {
       setLoading(false);
    }
  };

  const fetchMessages = async () => {
     try {
       const res = await negotiationApi.getMessages(id);
       setMessages(res.data?.data || res.data || []);
     } catch (err) {
       console.error("Polling error", err);
     }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await negotiationApi.sendMessage(id, { content: newMessage });
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      showToast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!deal) return <div className="p-8">Deal not found</div>;

  return (
    <div className="fixed inset-0 pt-14 flex flex-col bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
       {/* Header */}
       <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/stockship/client/deals')}>
                <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
             </Button>
             <div>
                <h1 className="text-lg font-bold text-gray-900">{deal.offer?.title || `Deal #${deal.id}`}</h1>
                <p className="text-sm text-gray-500">{t('common.status')}: {deal.status}</p>
             </div>
          </div>
       </div>

       <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Deal Info */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block p-6 space-y-6">
             <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Offer Details</h3>
                <Card className="shadow-sm">
                   <CardContent className="p-4 space-y-3">
                      <p className="font-medium">{deal.offer?.title}</p>
                      <div className="text-sm text-gray-600">
                         <div className="flex justify-between py-1 border-b border-gray-100">
                            <span>Price:</span>
                            <span>{deal.offer?.price || 'Negotiable'}</span>
                         </div>
                         <div className="flex justify-between py-1 border-b border-gray-100">
                            <span>Category:</span>
                            <span>{deal.offer?.category || 'N/A'}</span>
                         </div>
                      </div>
                   </CardContent>
                </Card>
             </div>
             
             <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Trader</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Store className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="font-medium text-sm">{deal.trader?.companyName || deal.trader?.name}</p>
                      <p className="text-xs text-gray-500">Code: {deal.trader?.traderCode}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50 relative">
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                   <div className="text-center text-gray-400 mt-10">
                      <p>Start the conversation with the trader.</p>
                   </div>
                ) : (
                   messages.map((msg, idx) => {
                      const isMe = msg.senderType === 'CLIENT'; // Adjust based on API response structure
                      return (
                         <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                               isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                            }`}>
                               <p className="text-sm">{msg.content}</p>
                               <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                               </p>
                            </div>
                         </div>
                      )
                   })
                )}
                <div ref={messagesEndRef} />
             </div>

             {/* Message Input */}
             <div className="bg-white p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                   <Input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('chat.placeholder') || "Type your message..."}
                      className="flex-1"
                   />
                   <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />}
                   </Button>
                </form>
             </div>
          </div>
       </div>
    </div>
  );
}
