import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dealService } from "../../services/dealService";
import { ROUTES } from "../../routes";
import { ChevronLeft, ChevronRight, ShoppingCart, User, Calendar, CreditCard, Box, AlertCircle } from "lucide-react";

export default function TraderViewDeal() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { id } = useParams();
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);
        const res = await dealService.getDealById(id);
        setDeal(res.data.data || res.data);
      } catch (err) {
        console.error("Error fetching deal:", err);
        setError("Failed to load deal details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDeal();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('common.error', 'خطأ')}</h2>
        <p className="text-slate-600 mb-6">{error || t('trader.dealNotFound', 'الصفقة غير موجودة')}</p>
        <Link to={ROUTES.TRADER_DEALS} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {t('common.back', 'عودة')}
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      NEGOTIATION: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      SETTLED: 'bg-indigo-100 text-indigo-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    try {
      return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return amount;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12" dir={currentDir}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
          <Link to={ROUTES.TRADER_DASHBOARD} className="hover:text-slate-900">{t('trader.dashboard', 'لوحة التحكم')}</Link>
          {currentDir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Link to={ROUTES.TRADER_DEALS} className="hover:text-slate-900">{t('trader.deals', 'صفقاتي')}</Link>
          {currentDir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-slate-900 font-semibold truncate max-w-[200px]">{deal.dealNumber || '#' + deal.id.substring(0,8)}</span>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content - Left Col */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Deal Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('trader.deal', 'صفقة')} {deal.dealNumber}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                    {deal.status}
                  </span>
                </div>
                <div className="flex flex-col items-end text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </span>
                  <span className="mt-1 font-bold text-slate-900 text-lg">
                    {formatCurrency(deal.negotiatedAmount)}
                  </span>
                </div>
              </div>

              {/* Deal Stages / Progress could accept status logic later */}
            </div>

            {/* Related Offer Details (if available in deal object) */}
            {deal.offer && (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Box className="w-5 h-5 text-blue-600" />
                    {t('trader.relatedOffer', 'العرض المرتبط')}
                 </h3>
                 <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50">
                    <div className="w-16 h-16 bg-white rounded border border-slate-200 overflow-hidden">
                       {deal.offer.images && deal.offer.images[0] ? (
                           <img src={deal.offer.images[0]} alt="" className="w-full h-full object-cover" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300"><Box /></div>
                       )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">{deal.offer.title}</h4>
                        <Link to={ROUTES.TRADER_OFFER_DETAILS.replace(':id', deal.offer.id)} className="text-sm text-blue-600 hover:underline">
                            {t('common.viewDetails', 'عرض التفاصيل')}
                        </Link>
                    </div>
                 </div>
               </div>
            )}
            
            {/* Payment Info */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    {t('checkout.payment', 'الدفع')}
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-600">{t('checkout.total', 'الإجمالي')}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(deal.negotiatedAmount)}</span>
                    </div>
                    {/* Add more payment details if available (method, date, etc) */}
                 </div>
             </div>

          </div>

          {/* Sidebar - Right Col */}
          <div className="space-y-6">
            {/* Client Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <User className="w-5 h-5 text-slate-500" />
                 {t('trader.client', 'العميل')}
              </h3>
              
              {deal.client ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {deal.client.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900">{deal.client.name}</div>
                        <div className="text-slate-500">{deal.client.email}</div>
                    </div>
                  </div>
                  
                  {deal.client.phone && (
                     <div className="pt-3 border-t border-slate-50 flex justify-between">
                        <span className="text-slate-500">{t('common.phone', 'الهاتف')}</span>
                        <span className="text-slate-900">{deal.client.phone}</span>
                     </div>
                  )}
                  {deal.client.country && (
                     <div className="pt-2 flex justify-between">
                        <span className="text-slate-500">{t('common.country', 'الدولة')}</span>
                        <span className="text-slate-900">{deal.client.country}</span>
                     </div>
                  )}
                </div>
              ) : (
                 <div className="text-slate-500 italic">{t('trader.noClientInfo', 'معلومات العميل غير متوفرة')}</div>
              )}
            </div>

            {/* Actions for Trader (e.g., Approve, Reject - simplified for now) */}
            {deal.status === 'NEGOTIATION' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-3">{t('common.actions', 'إجراءات')}</h3>
                    <button className="w-full mb-2 py-2 px-4 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition">
                        {t('trader.approveDeal', 'موافقة على الصفقة')}
                    </button>
                    <button className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded font-medium hover:bg-red-50 transition">
                         {t('trader.rejectDeal', 'رفض الصفقة')}
                    </button>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
