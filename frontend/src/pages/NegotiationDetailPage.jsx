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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDeal = async () => {
    try {
      // Always fetch the latest deal data from the API to get the correct status
      const response = await dealService.getDealById(dealId);
      console.log("✅ Full API Response:", response.data);
      
      // The API returns data in response.data.data, which contains { deal, platformSettings }
      let dealData = null;
      if (response.data?.success && response.data?.data) {
        // The backend returns { deal, platformSettings }, so we need to access .deal
        if (response.data.data.deal) {
          dealData = response.data.data.deal;
        } else if (response.data.data.id) {
          // Fallback: if data is the deal itself (not nested)
          dealData = response.data.data;
        }
      }
      
      if (dealData) {
        console.log("✅ Deal fetched from API - Full Deal:", dealData);
        console.log("✅ Deal Status:", dealData.status, "Deal ID:", dealData.id);
        
        // Ensure status exists, if not set a default
        if (!dealData.status) {
          console.warn("⚠️ Deal status is missing, setting default to NEGOTIATION");
          dealData.status = 'NEGOTIATION';
        }
        
        setDeal(dealData);
        return;
      } else {
        console.warn("⚠️ No deal data found in API response");
      }
    } catch (error) {
      console.error("❌ Error fetching deal:", error);
    }
    
    // Fallback: use deal from location.state if API call fails
    if (location.state?.deal) {
      const dealFromState = { ...location.state.deal };
      console.log("⚠️ Using deal from state - Full Deal:", dealFromState);
      
      // Map back the status: if it was PENDING in negotiations page, it's actually NEGOTIATION in DB
      // Also check for originalStatus if it was passed
      if (dealFromState.originalStatus) {
        dealFromState.status = dealFromState.originalStatus;
      } else if (dealFromState.status === 'PENDING') {
        dealFromState.status = 'NEGOTIATION';
      } else if (dealFromState.status === 'ACCEPTED') {
        dealFromState.status = 'APPROVED';
      } else if (!dealFromState.status) {
        console.warn("⚠️ Deal status is missing in state, setting default to NEGOTIATION");
        dealFromState.status = 'NEGOTIATION';
      }
      console.log("⚠️ Using deal from state - Status:", dealFromState.status);
      setDeal(dealFromState);
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
        // Ensure messages are sorted by createdAt (oldest first)
        const sortedMessages = [...response.data.data].sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, dealId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Get the actual status from deal (should be from database)
  // Add fallback in case status is missing
  const dealStatus = deal?.status || 'NEGOTIATION';
  
  // Normalize deal status for display and logic
  // Map PENDING/ACCEPTED (display status) back to NEGOTIATION/APPROVED (DB status)
  const normalizedStatus = dealStatus === 'PENDING' ? 'NEGOTIATION' : 
                          dealStatus === 'ACCEPTED' ? 'APPROVED' : 
                          dealStatus;
  
  console.log("🔍 Status Debug:", {
    dealObject: deal,
    dealStatus: dealStatus,
    normalizedStatus: normalizedStatus,
    dealId: deal?.id,
    hasStatus: !!deal?.status
  });
  
  const badge = getStatusBadge(normalizedStatus, t);
  const StatusIcon = badge.icon;
  // Determine if current user is client or trader
  const isClient = user?.id === deal.clientId;
  const isTrader = user?.id === deal.traderId;
  const otherParty = isClient ? deal.trader : deal.client;
  
  // Check if negotiation is allowed
  // The deal status should be NEGOTIATION or APPROVED from the database
  // Also handle display statuses PENDING (maps to NEGOTIATION) and ACCEPTED (maps to APPROVED)
  // Check both the raw status and normalized status to be safe
  const canNegotiate = dealStatus === 'NEGOTIATION' || 
                       dealStatus === 'APPROVED' ||
                       normalizedStatus === 'NEGOTIATION' || 
                       normalizedStatus === 'APPROVED';
  
  console.log("🔍 Can Negotiate Check:", {
    dealStatus: dealStatus,
    normalizedStatus: normalizedStatus,
    canNegotiate: canNegotiate,
    checks: {
      rawIsNEGOTIATION: dealStatus === 'NEGOTIATION',
      rawIsAPPROVED: dealStatus === 'APPROVED',
      normalizedIsNEGOTIATION: normalizedStatus === 'NEGOTIATION',
      normalizedIsAPPROVED: normalizedStatus === 'APPROVED'
    }
  });

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
                  // Check if message was sent by current user
                  const isMyMessage = message.senderId === user?.id || 
                    (isClient && message.senderType === 'CLIENT' && message.clientId === user?.id) ||
                    (isTrader && message.senderType === 'TRADER' && message.traderId === user?.id);
                  
                  // Determine sender name
                  let senderName = t("negotiations.you") || "أنت";
                  if (!isMyMessage) {
                    if (message.senderType === 'CLIENT') {
                      senderName = deal.client?.name || message.client?.name || t("negotiations.otherParty") || "الطرف الآخر";
                    } else if (message.senderType === 'TRADER') {
                      senderName = deal.trader?.companyName || deal.trader?.name || message.trader?.companyName || message.trader?.name || t("negotiations.otherParty") || "الطرف الآخر";
                    } else {
                      senderName = t("negotiations.otherParty") || "الطرف الآخر";
                    }
                  }

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
          {/* Allow negotiation if status is NEGOTIATION or APPROVED */}
          {canNegotiate ? (
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
