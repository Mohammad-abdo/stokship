import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/Layout";
import { ArrowLeft, Send, MessageSquare, DollarSign, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { ROUTES } from "../routes";

const getStatusBadge = (status, t) => {
  const statusMap = {
    'PENDING': { 
      label: t("negotiations.status.pending") || "قيد الانتظار", 
      className: "bg-amber-100 text-amber-900",
      icon: Clock
    },
    'ACCEPTED': { 
      label: t("negotiations.status.accepted") || "مقبول", 
      className: "bg-green-100 text-green-900",
      icon: CheckCircle
    },
    'REJECTED': { 
      label: t("negotiations.status.rejected") || "مرفوض", 
      className: "bg-red-100 text-red-900",
      icon: XCircle
    },
    'NEGOTIATION': { 
      label: t("negotiations.status.negotiating") || "قيد التفاوض", 
      className: "bg-blue-100 text-blue-900",
      icon: MessageSquare
    },
  };
  
  return statusMap[status] || { 
    label: status, 
    className: "bg-slate-100 text-slate-900",
    icon: Clock
  };
};

export default function NegotiationDetailPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { dealId } = useParams();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const [deal, setDeal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedQuantity, setProposedQuantity] = useState("");
  const [messageType, setMessageType] = useState("TEXT");

  useEffect(() => {
    if (isAuthenticated && dealId) {
      fetchDeal();
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, dealId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDeal = async () => {
    try {
      const response = await dealService.getDealById(dealId);
      if (response.data?.success && response.data?.data) {
        setDeal(response.data.data);
      } else if (location.state?.deal) {
        setDeal(location.state.deal);
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
      if (location.state?.deal) {
        setDeal(location.state.deal);
      }
    }
  };

  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await dealService.getNegotiationMessages(dealId, {
        page: 1,
        limit: 100
      });
      
      if (response.data?.success && response.data?.data) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !proposedPrice && !proposedQuantity) {
      return;
    }

    try {
      setSending(true);
      const messageData = {
        message: messageText.trim() || null,
        messageType: messageType,
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
        proposedQuantity: proposedQuantity ? parseInt(proposedQuantity) : null
      };

      await dealService.sendNegotiationMessage(dealId, messageData);
      
      // Clear form
      setMessageText("");
      setProposedPrice("");
      setProposedQuantity("");
      setMessageType("TEXT");
      
      // Refresh messages
      await fetchMessages(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(t("negotiations.errorSendingMessage") || "حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-600">
              {t("negotiations.notAuthenticated") || "يجب تسجيل الدخول لعرض التفاوض"}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading && !deal) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-500">
              {t("common.loading") || "جاري التحميل..."}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-600">
              {t("negotiations.dealNotFound") || "لم يتم العثور على الصفقة"}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const badge = getStatusBadge(deal.status, t);
  const StatusIcon = badge.icon;
  const isClient = user?.id === deal.clientId;
  const otherParty = isClient ? deal.trader : deal.client;

  return (
    <MainLayout>
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(ROUTES.NEGOTIATIONS)}
              className={`flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t("negotiations.backToNegotiations") || "العودة إلى طلبات التفاوض"}</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <StatusIcon className={`h-5 w-5 ${badge.className.split(' ')[1]}`} />
              <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>
            </div>

            {deal.offer && (
              <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 mb-2 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {deal.offer.title || t("negotiations.offer") || "عرض"}
              </h1>
            )}

            {otherParty && (
              <div className="text-slate-600">
                {t("negotiations.negotiatingWith") || "التفاوض مع"}:{" "}
                <span className="font-semibold">
                  {otherParty.companyName || otherParty.name || t("negotiations.trader") || "تاجر"}
                </span>
              </div>
            )}

            {deal.dealNumber && (
              <div className="text-sm text-slate-500 mt-2">
                {t("negotiations.dealNumber") || "رقم الصفقة"}: {deal.dealNumber}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 mb-6">
            <div className="p-4 border-b border-slate-200">
              <h2 className={`text-lg font-semibold text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {t("negotiations.messages") || "الرسائل"}
              </h2>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {loading && messages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  {t("common.loading") || "جاري التحميل..."}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  {t("negotiations.noMessages") || "لا توجد رسائل بعد"}
                </div>
              ) : (
                messages.map((message) => {
                  const isMyMessage = message.senderId === user?.id;
                  const senderName = isMyMessage 
                    ? (isClient ? t("negotiations.you") || "أنت" : t("negotiations.you") || "أنت")
                    : (message.senderType === 'CLIENT' ? deal.client?.name : deal.trader?.companyName || deal.trader?.name) || t("negotiations.otherParty") || "الطرف الآخر";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage ? (currentDir === 'rtl' ? 'justify-start' : 'justify-end') : (currentDir === 'rtl' ? 'justify-end' : 'justify-start')}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isMyMessage
                            ? "bg-blue-900 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">{senderName}</div>
                        
                        {message.message && (
                          <div className="mb-2">{message.message}</div>
                        )}

                        {message.proposedPrice && (
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {t("negotiations.proposedPrice") || "السعر المقترح"}: {message.proposedPrice.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                            </span>
                          </div>
                        )}

                        {message.proposedQuantity && (
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <Package className="h-4 w-4" />
                            <span>
                              {t("negotiations.proposedQuantity") || "الكمية المقترحة"}: {message.proposedQuantity}
                            </span>
                          </div>
                        )}

                        <div className="text-xs opacity-75 mt-2">
                          {new Date(message.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          {deal.status === 'NEGOTIATION' || deal.status === 'APPROVED' ? (
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-4">
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setMessageType("TEXT")}
                    className={`px-3 py-1 rounded text-sm ${
                      messageType === "TEXT"
                        ? "bg-blue-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t("negotiations.textMessage") || "رسالة نصية"}
                  </button>
                  <button
                    onClick={() => setMessageType("PRICE_PROPOSAL")}
                    className={`px-3 py-1 rounded text-sm ${
                      messageType === "PRICE_PROPOSAL"
                        ? "bg-blue-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t("negotiations.priceProposal") || "اقتراح سعر"}
                  </button>
                  <button
                    onClick={() => setMessageType("QUANTITY_PROPOSAL")}
                    className={`px-3 py-1 rounded text-sm ${
                      messageType === "QUANTITY_PROPOSAL"
                        ? "bg-blue-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t("negotiations.quantityProposal") || "اقتراح كمية"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t("negotiations.typeMessage") || "اكتب رسالتك هنا..."}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  rows={3}
                />

                {messageType === "PRICE_PROPOSAL" && (
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder={t("negotiations.enterPrice") || "أدخل السعر المقترح"}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                )}

                {messageType === "QUANTITY_PROPOSAL" && (
                  <input
                    type="number"
                    value={proposedQuantity}
                    onChange={(e) => setProposedQuantity(e.target.value)}
                    placeholder={t("negotiations.enterQuantity") || "أدخل الكمية المقترحة"}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                )}

                <button
                  onClick={handleSendMessage}
                  disabled={sending || (!messageText.trim() && !proposedPrice && !proposedQuantity)}
                  className={`flex items-center gap-2 rounded-md bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed ${currentDir === 'rtl' ? 'flex-row-reverse ml-auto' : 'flex-row'}`}
                >
                  <Send className="h-4 w-4" />
                  {sending ? (t("negotiations.sending") || "جاري الإرسال...") : (t("negotiations.send") || "إرسال")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center text-amber-800">
              {t("negotiations.negotiationClosed") || "تم إغلاق التفاوض على هذه الصفقة"}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
