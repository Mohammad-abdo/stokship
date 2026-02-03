import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dealService } from '../services/dealService';
import { MainLayout } from '../components/Layout';
import { ArrowLeft, Printer, Video, CheckCircle, XCircle } from 'lucide-react';
import { ROUTES } from '../routes';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE.replace(/\/api$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

export default function ClientPriceQuotePage() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'ar';
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [productState, setProductState] = useState([]);
  const [actionLoading, setActionLoading] = useState(null); // 'accept' | 'reject'

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealService.getDealById(dealId);
      const data = response.data?.data || response.data;
      const dealData = data?.deal || data;
      setDeal(dealData);
      if (data?.platformSettings) setPlatformSettings(data.platformSettings);

      if (dealData?.items?.length) {
        const products = dealData.items.map((dealItem) => {
          const { offerItem } = dealItem;
          if (!offerItem) return null;
          let images = [];
          try {
            const parsed = typeof offerItem.images === 'string' ? JSON.parse(offerItem.images || '[]') : (offerItem.images || []);
            if (Array.isArray(parsed)) {
              images = parsed.map((img) => {
                const url = typeof img === 'string' ? img : (img?.url || img?.src || img);
                return url ? (url.startsWith('http') ? url : getFileUrl(url)) : null;
              }).filter(Boolean);
            }
          } catch (e) {}
          const imageUrl = images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
          return {
            id: dealItem.id,
            image: imageUrl,
            title: offerItem.productName || offerItem.description || t('negotiations.product') || 'منتج',
            itemNumber: offerItem.itemNo || `#${(offerItem.id || '').slice(0, 8)}`,
            description: offerItem.description || offerItem.notes || '',
            quantity: parseInt(offerItem.quantity) || 0,
            piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.cartons || 1),
            pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
            cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
            negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : parseFloat(offerItem.unitPrice) || 0,
            negotiationQuantity: parseInt(dealItem.quantity) || 0,
          };
        }).filter(Boolean);
        setProductState(products);
      } else {
        setProductState([]);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      navigate(ROUTES.NEGOTIATIONS);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!deal) return;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const dealAmount = Number(deal.negotiatedAmount) || 0;
    const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
    const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
    const employeeRate = deal?.employee?.commissionRate != null ? parseFloat(deal.employee.commissionRate) : 1;
    const platformComm = (dealAmount * platformRate) / 100;
    const shippingComm = (dealAmount * shippingRate) / 100;
    const employeeComm = (dealAmount * employeeRate) / 100;
    const totalAmount = dealAmount + platformComm + shippingComm + employeeComm;
    const title = t('negotiations.priceQuote') || 'عرض السعر';
    const cardsHtml = productState.map((p) => {
      const totalQty = p.negotiationQuantity || 0;
      const totalPrice = totalQty * (p.negotiationPrice || 0);
      return `<div style="background:white;border-radius:1rem;padding:1.5rem;margin-bottom:1rem;border:1px solid #e5e7eb;">
        <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem;">
          <div><img src="${p.image}" alt="${p.title}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:0.5rem;" /></div>
          <div>
            <h3 style="font-size:1.125rem;font-weight:bold;color:#111;">${p.title}</h3>
            <p style="font-size:0.875rem;color:#6b7280;">${p.itemNumber}</p>
            <p style="margin-top:1rem;font-size:0.875rem;">${t('negotiations.quantity') || 'الكمية'}: ${p.quantity} | ${t('negotiations.price') || 'السعر'}: $${(p.negotiationPrice || 0).toFixed(2)} | ${t('negotiations.totalPrice') || 'الإجمالي'}: $${totalPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>`;
    }).join('');
    const summaryHtml = `<div style="background:white;padding:1rem;border-radius:0.5rem;margin-top:1rem;border:1px solid #e5e7eb;">
      <p style="margin:0;display:flex;justify-content:space-between;"><span>${t('negotiations.negotiatedAmount') || 'قيمة الصفقة'}</span><strong>$${dealAmount.toFixed(2)}</strong></p>
      <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('negotiations.platformCommission') || 'عمولة المنصة'} (${platformRate}%)</span><strong>$${platformComm.toFixed(2)}</strong></p>
      <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('negotiations.shippingToClient') || 'التوصيل'} (${shippingRate}%)</span><strong>$${shippingComm.toFixed(2)}</strong></p>
      <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('negotiations.employeeCommission') || 'عمولة الموظف'} (${employeeRate}%)</span><strong>$${employeeComm.toFixed(2)}</strong></p>
      <p style="margin:0.75rem 0 0;padding-top:0.75rem;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;font-size:1.25rem;"><span>${t('negotiations.grandTotal') || 'الإجمالي'}</span><strong style="color:#15803d;">$${totalAmount.toFixed(2)}</strong></p>
    </div>`;
    const html = `<!DOCTYPE html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"/><title>${title} - ${deal.dealNumber}</title></head><body style="font-family:system-ui;padding:1.5rem;background:#f3f4f6;"><div style="background:white;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;"><p style="font-size:1.5rem;font-weight:bold;color:#1e40af;">Stockship</p><p style="margin:0.25rem 0 0;color:#6b7280;">${deal.dealNumber} | ${deal.client?.name || ''}</p></div>${cardsHtml}${summaryHtml}</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!deal) return null;

  const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
  const quoteExpired = deal.quoteSentAt && (Date.now() - new Date(deal.quoteSentAt).getTime() > SEVENTY_TWO_HOURS_MS);
  const isCancelled72h = deal.status === 'CANCELLED' && deal.cancellationReason && (
    deal.cancellationReason.includes('72') || deal.cancellationReason.includes('hours') || deal.cancellationReason.includes('approval')
  );
  const canAcceptRejectCancel = deal.status === 'NEGOTIATION' && !quoteExpired;
  const isApproved = deal.status === 'APPROVED';
  const isPaid = deal.status === 'PAID';

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      const res = await dealService.clientAcceptDeal(dealId);
      const updatedDeal = res.data?.data ?? res.data;
      navigate(ROUTES.DEAL_CART, { state: { dealId, deal: updatedDeal } });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || (lang === 'ar' ? 'فشل في الموافقة' : 'Failed to accept');
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(t('negotiations.rejectQuote') || 'رفض')) return;
    setActionLoading('reject');
    try {
      await dealService.clientRejectDeal(dealId);
      navigate(ROUTES.NEGOTIATIONS);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || (lang === 'ar' ? 'فشل في الرفض' : 'Failed to reject');
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const dealAmount = Number(deal.negotiatedAmount) || 0;
  const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
  const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
  const employeeRate = deal.employee?.commissionRate != null ? parseFloat(deal.employee.commissionRate) : 1;
  const platformComm = (dealAmount * platformRate) / 100;
  const shippingComm = (dealAmount * shippingRate) / 100;
  const employeeComm = (dealAmount * employeeRate) / 100;
  const totalAmount = dealAmount + platformComm + shippingComm + employeeComm;
  const isRTL = lang === 'ar';

  return (
    <MainLayout>
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => navigate(ROUTES.NEGOTIATIONS)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h1 className="text-2xl font-bold text-gray-900">{t('negotiations.priceQuote') || 'عرض السعر'}</h1>
                <p className="text-sm text-gray-500">{deal.dealNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              {t('negotiations.printOrPdf') || 'طباعة / حفظ PDF'}
            </button>
          </div>

          {isCancelled72h && (
            <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800" role="alert">
              <p className="font-semibold">{t('negotiations.cancelled72h') || 'تم إلغاء الصفقة لمرور 72 ساعة ولم يتم الدفع'}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <p className="text-2xl font-bold text-blue-700 mb-4">Stockship</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">{t('negotiations.dealNumber') || 'رقم الصفقة'}</p><p className="font-semibold text-gray-900">{deal.dealNumber}</p></div>
              <div><p className="text-gray-500">{t('negotiations.client') || 'العميل'}</p><p className="font-semibold text-gray-900">{deal.client?.name || '—'}</p></div>
              <div><p className="text-gray-500">{t('negotiations.trader') || 'التاجر'}</p><p className="font-semibold text-gray-900">{deal.trader?.name || deal.trader?.companyName || '—'}</p></div>
              <div><p className="text-gray-500">{t('negotiations.employee') || 'الموظف'}</p><p className="font-semibold text-gray-900">{deal.employee?.name || '—'}</p></div>
              {deal.shippingType && (
                <div><p className="text-gray-500">{t('payment.shippingType') || 'نوع الشحن'}</p><p className="font-semibold text-gray-900">{deal.shippingType === 'SEA' ? (t('payment.shippingTypeSea') || 'بحري') : (t('payment.shippingTypeLand') || 'بري')}</p></div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {productState.map((product, index) => {
              const totalQty = product.negotiationQuantity || 0;
              const totalCbmProduct = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
              const totalPriceProduct = totalQty * (product.negotiationPrice || 0);
              return (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                    <div className="relative">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'; }} />
                        <span className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="w-20 h-20 mt-2 rounded border border-gray-200 flex items-center justify-center bg-gray-50">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
                      <p className="text-sm text-gray-500">{product.itemNumber}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-gray-500">{t('negotiations.quantity') || 'الكمية'}</p><p className="font-semibold">{product.quantity} ({product.piecesPerCarton} {t('negotiations.piecesInCarton') || 'قطع/كرتون'})</p></div>
                        <div><p className="text-gray-500">{t('negotiations.pricePerPiece') || 'سعر القطعة'}</p><p className="font-semibold">${(product.pricePerPiece || 0).toFixed(2)}</p></div>
                        <div><p className="text-gray-500">{t('negotiations.negotiationPrice') || 'السعر المتفاوض عليه'}</p><p className="font-semibold">${(product.negotiationPrice || 0).toFixed(2)}</p></div>
                        <div><p className="text-gray-500">{t('negotiations.negotiationQuantity') || 'الكمية المتفاوض عليها'}</p><p className="font-semibold">{product.negotiationQuantity || 0}</p></div>
                        <div><p className="text-gray-500">CBM</p><p className="font-semibold">{(product.cbm || 0).toFixed(2)}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 text-sm">
                        <div><p className="text-gray-500">{t('negotiations.totalQuantity') || 'الكمية الإجمالية'}</p><p className="font-semibold">{totalQty.toLocaleString()}</p></div>
                        <div><p className="text-gray-500">{t('negotiations.totalCbm') || 'إجمالي CBM'}</p><p className="font-semibold">{totalCbmProduct.toFixed(2)}</p></div>
                        <div><p className="text-gray-500">{t('negotiations.totalPrice') || 'السعر الإجمالي'}</p><p className="font-semibold text-green-700">${totalPriceProduct.toFixed(2)}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mt-6 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.negotiatedAmount') || 'قيمة الصفقة'}</span><span className="font-semibold">${dealAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.platformCommission') || 'عمولة المنصة'} ({platformRate}%)</span><span className="font-semibold">${platformComm.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.shippingToClient') || 'التوصيل للعميل'} ({shippingRate}%)</span><span className="font-semibold">${shippingComm.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t('negotiations.employeeCommission') || 'عمولة الموظف'} ({employeeRate}%)</span><span className="font-semibold">${employeeComm.toFixed(2)}</span></div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-lg font-bold text-gray-900">{t('negotiations.grandTotal') || 'الإجمالي'}</span>
              <span className="text-2xl font-bold text-green-700">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {canAcceptRejectCancel && (
            <div className={`mt-6 flex flex-wrap gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={handleAccept}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-md"
              >
                {actionLoading === 'accept' ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                )}
                <span>{t('negotiations.acceptPriceQuote') || 'قبول عرض السعر'}</span>
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-md"
              >
                {actionLoading === 'reject' ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <XCircle className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                )}
                <span>{t('negotiations.rejectQuote') || 'رفض'}</span>
              </button>
            </div>
          )}

          {isPaid && (
            <div className={`mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-slate-800 font-semibold">{t('negotiations.paymentCompleted') || 'تم الدفع'}</p>
              <p className="text-slate-600 text-sm mt-1">{t('negotiations.paymentCompletedDesc') || 'تم إتمام دفع هذه الصفقة ولا تظهر في السلة.'}</p>
            </div>
          )}

          {isApproved && !isPaid && (
            <div className={`mt-6 p-4 rounded-xl bg-green-50 border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-green-800 font-semibold mb-2">{t('negotiations.quoteAcceptedGoToCart') || 'تمت الموافقة على عرض السعر'}</p>
              <button
                type="button"
                onClick={() => navigate(ROUTES.DEAL_CART, { state: { dealId, deal } })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm"
              >
                {t('negotiations.goToDealCart') || 'الذهاب إلى سلة الصفقة'}
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
