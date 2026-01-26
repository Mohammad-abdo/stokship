import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/Layout";
import { ArrowLeft, X } from "lucide-react";
import { ROUTES } from "../routes";

export default function NegotiationDetailPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { dealId } = useParams();
  const location = useLocation();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productState, setProductState] = useState([]);
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);


  const fetchDeal = async () => {
    try {
      const response = await dealService.getDealById(dealId);
      let dealData = null;
      if (response.data?.success && response.data?.data) {
        if (response.data.data.deal) {
          dealData = response.data.data.deal;
        } else if (response.data.data.id) {
          dealData = response.data.data;
        }
      }

      if (dealData) {
        if (!dealData.status) {
          dealData.status = 'NEGOTIATION';
        }
        setDeal(dealData);
        setNotes(dealData.notes || "");

        // Transform deal items to product format
        if (dealData.items && dealData.items.length > 0) {
          const products = dealData.items.map((dealItem, index) => {
            const { offerItem } = dealItem;
            if (!offerItem) return null;

            // Parse images
            let images = [];
            try {
              const parsedImages = typeof offerItem.images === 'string'
                ? JSON.parse(offerItem.images)
                : offerItem.images;
              if (Array.isArray(parsedImages)) {
                images = parsedImages.map(img => {
                  const imgUrl = typeof img === 'string' ? img : (img?.url || img?.src || img);
                  if (!imgUrl) return null;
                  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                    return imgUrl;
                  }
                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  const BASE_URL = API_URL.replace('/api', '');
                  return `${BASE_URL}${imgUrl.startsWith('/') ? imgUrl : '/uploads/' + imgUrl}`;
                }).filter(Boolean);
              }
            } catch (e) {
              console.warn('Error parsing images:', e);
            }

            const imageUrl = images.length > 0
              ? images[0]
              : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

            return {
              id: dealItem.id,
              dealItemId: dealItem.id,
              offerItemId: offerItem.id,
              image: imageUrl,
              thumbnails: images.length > 1 ? images.slice(1, 4) : [],
              images: images,
              title: offerItem.productName || offerItem.description || t("negotiations.product") || "منتج",
              itemNumber: offerItem.itemNo || `#${offerItem.id?.substring(0, 8) || 'N/A'}`,
              country: dealData.offer?.country || "🇨🇳",
              description: offerItem.description || offerItem.notes || "",
              quantity: parseInt(offerItem.quantity) || 0,
              piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.cartons || 1),
              pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
              cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
              negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : "",
              negotiationQuantity: dealItem.quantity || "",
              currency: offerItem.currency || 'SAR',
              soldOut: false
            };
          }).filter(Boolean);

          setProductState(products);
        }
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await dealService.getNegotiationMessages(dealId, {
        page: 1,
        limit: 100
      });

      if (response.data?.success && response.data?.data) {
        const messagesData = Array.isArray(response.data.data) ? response.data.data : [];
        const sortedMessages = [...messagesData].sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && dealId) {
      fetchDeal();
      fetchMessages();
    }
  }, [isAuthenticated, dealId]);

  const handleNegotiationChange = (productId, field, value) => {
    setProductState((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const calculateTotals = () => {
    const selectedProducts = productState.filter(
      (p) => !p.soldOut && (p.negotiationQuantity || p.negotiationPrice)
    );

    let totalQuantity = 0;
    let totalPrice = 0;
    let totalCbm = 0;

    selectedProducts.forEach((p) => {
      const qty = parseInt(p.negotiationQuantity) || 0;
      const price = parseFloat(p.negotiationPrice) || p.pricePerPiece;
      totalQuantity += qty;
      totalPrice += qty * price;
      totalCbm += (qty / p.quantity) * p.cbm;
    });

    return { totalQuantity, totalPrice, totalCbm };
  };

  const { totalQuantity, totalPrice, totalCbm } = calculateTotals();

  const summaryData = productState
    .filter((p) => p.soldOut || p.negotiationQuantity || p.negotiationPrice)
    .map((p) => ({
      id: p.id,
      itemNumber: p.itemNumber,
      quantity: p.soldOut ? p.negotiationQuantity : p.negotiationQuantity || 1,
      price: p.soldOut ? p.negotiationPrice : p.negotiationPrice || p.pricePerPiece,
      cbm: p.soldOut
        ? ((p.negotiationQuantity || 0) / p.quantity) * p.cbm
        : ((parseInt(p.negotiationQuantity) || 0) / p.quantity) * p.cbm || p.cbm,
    }));

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

  return (
    <MainLayout>
      <div dir={currentDir} className="min-h-screen bg-white pt-40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          {/* Header */}
          <div className="bg-[#EEF4FF] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {deal.offer?.title || t("negotiations.negotiationDetails") || "تفاصيل التفاوض"}
              </h1>
              {deal.dealNumber && (
                <div className="text-sm text-slate-600 mt-1">
                  {t("negotiations.dealNumber") || "رقم الصفقة"}: {deal.dealNumber}
                </div>
              )}
              {productState.length > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  ✅ {productState.length} {t("negotiations.products") || "منتجات"}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(ROUTES.NEGOTIATIONS)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Products List */}
          {!loading && (
            <div className="space-y-6 mb-8">
              {productState.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-yellow-800 font-semibold mb-2">
                      {t("negotiations.noProducts") || "لا توجد منتجات"}
                    </p>
                  </div>
                </div>
              ) : (
                productState.map((product, index) => {
                  const negotiationQty = product.soldOut
                    ? (parseInt(product.negotiationQuantity) || 0)
                    : (parseInt(product.negotiationQuantity) || 0);
                  const negotiationPrice = product.soldOut
                    ? (parseFloat(product.negotiationPrice) || 0)
                    : (parseFloat(product.negotiationPrice) || product.pricePerPiece || 0);

                  const totalQty = negotiationQty;
                  const totalCbmForProduct = product.quantity > 0
                    ? (negotiationQty / product.quantity) * product.cbm
                    : 0;
                  const totalPriceForProduct = negotiationQty * negotiationPrice;

                  return (
                    <div
                      key={product.id}
                      className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                    >
                      {product.soldOut && (
                        <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                          <div className="bg-red-600 text-white px-8 py-4 rounded-lg text-2xl font-bold">
                            {t("negotiations.soldOut") || "نفذت الكمية"}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                        {/* Product Image Section */}
                        <div className="space-y-2">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
                            }}
                          />
                          <div className="flex gap-2">
                            {product.thumbnails && product.thumbnails.length > 0 ? (
                              product.thumbnails.map((thumb, idx) => (
                                <img
                                  key={idx}
                                  src={thumb}
                                  alt={`${product.title} ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded border border-slate-200"
                                  onError={(e) => {
                                    e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=100&q=80";
                                  }}
                                />
                              ))
                            ) : null}
                            <div className="w-16 h-16 rounded border border-slate-200 flex items-center justify-center bg-slate-50">
                              <span className="text-xs">🎥</span>
                            </div>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{product.country}</span>
                              <h3 className="text-lg font-bold text-slate-900">
                                {product.title}
                              </h3>
                              <span className="text-sm text-slate-500">
                                {product.itemNumber}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {product.description}
                            </p>
                          </div>

                          {/* Product Info Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.quantity") || "الكمية"}</div>
                              <div className="font-semibold text-slate-900">
                                {product.quantity.toLocaleString()}
                                <span className="text-xs font-normal text-slate-500">
                                  {" "}
                                  ({product.piecesPerCarton} {t("negotiations.piecesInCarton") || "قطع/كرتون"})
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.pricePerPiece") || "سعر القطعة"}</div>
                              <div className="font-semibold text-slate-900">
                                {product.pricePerPiece.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.cbm") || "CBM"}</div>
                              <div className="font-semibold text-slate-900">
                                {product.cbm} CBM
                              </div>
                            </div>
                          </div>

                          {/* Negotiation Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-700 mb-2">
                                {t("negotiations.negotiationPrice") || "السعر المتفاوض عليه"}
                              </label>
                              {product.soldOut ? (
                                <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                                  {product.negotiationPrice} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={product.negotiationPrice}
                                  onChange={(e) =>
                                    handleNegotiationChange(
                                      product.id,
                                      "negotiationPrice",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={t("negotiations.enterPrice") || "أدخل السعر"}
                                  disabled={true}
                                />
                              )}
                            </div>
                            <div>
                              <label className="block text-sm text-slate-700 mb-2">
                                {t("negotiations.negotiationQuantity") || "الكمية المتفاوض عليها"}
                              </label>
                              {product.soldOut ? (
                                <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                                  {product.negotiationQuantity}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={product.negotiationQuantity}
                                  onChange={(e) =>
                                    handleNegotiationChange(
                                      product.id,
                                      "negotiationQuantity",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={t("negotiations.enterQuantity") || "أدخل الكمية"}
                                  disabled={true}
                                />
                              )}
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.totalQuantity") || "الكمية الإجمالية"}</div>
                              <div className="font-semibold text-slate-900">
                                {totalQty.toLocaleString()} {t("negotiations.piece") || "قطعة"}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.totalCbm") || "إجمالي CBM"}</div>
                              <div className="font-semibold text-slate-900">
                                {totalCbmForProduct.toFixed(2)} CBM
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">{t("negotiations.totalPrice") || "السعر الإجمالي"}</div>
                              <div className="font-semibold text-slate-900">
                                {totalPriceForProduct.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Number */}
                      <div className="absolute top-4 left-4 bg-blue-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Order Summary Table */}
          {summaryData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t("negotiations.orderSummary") || "ملخص الطلب"}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.serial") || "م"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.itemNumber") || "رقم الصنف"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.quantity") || "الكمية"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {t("negotiations.price") || "السعر"}
                      </th>
                      <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        CBM
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-900">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{item.itemNumber}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {item.price} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {item.cbm.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-3 px-4 text-sm text-slate-900" colSpan={2}>
                        {t("negotiations.total") || "المجموع"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {totalQuantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {totalPrice.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {totalCbm.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {t("negotiations.siteFee") || "سيتم احتساب رسوم الموقع"}
              </p>
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("negotiations.notes") || "ملاحظات"}
              </label>
              <textarea
                value={notes}
                readOnly
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50"
                placeholder={t("negotiations.noNotes") || "لا توجد ملاحظات"}
              />
            </div>
          </div>

          {/* Negotiation History Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {t("negotiations.history") || "سجل التفاوض"}
            </h2>

            {messagesLoading ? (
              <div className="text-center py-8 text-slate-500">
                {t("common.loading") || "جاري التحميل..."}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {t("negotiations.noMessages") || "لا توجد رسائل تفاوض"}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isClient = message.senderType === 'CLIENT';
                  const isTrader = message.senderType === 'TRADER';
                  const isEmployee = message.senderType === 'EMPLOYEE';

                  return (
                    <div
                      key={message.id || index}
                      className={`flex gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Timeline Dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 ${isClient ? 'bg-blue-500' :
                            isTrader ? 'bg-green-500' :
                              'bg-purple-500'
                          }`} />
                        {index < messages.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-200 mt-1" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${isClient ? 'text-blue-700' :
                              isTrader ? 'text-green-700' :
                                'text-purple-700'
                            }`}>
                            {isClient && (t("negotiations.client") || "العميل")}
                            {isTrader && (t("negotiations.trader") || "التاجر")}
                            {isEmployee && (t("negotiations.employee") || "الموظف")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(message.createdAt).toLocaleString(
                              i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )}
                          </span>
                        </div>

                        {message.message && (
                          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                            {message.message}
                          </div>
                        )}

                        {message.proposedPrice && (
                          <div className="mt-2 text-sm">
                            <span className="text-slate-600">{t("negotiations.proposedPrice") || "السعر المقترح"}: </span>
                            <span className="font-semibold text-green-700">
                              {parseFloat(message.proposedPrice).toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                            </span>
                          </div>
                        )}

                        {message.counterOffer !== null && message.counterOffer !== undefined && (
                          <div className="mt-1 text-sm">
                            <span className="text-slate-600">{t("negotiations.counterOffer") || "عرض مضاد"}: </span>
                            <span className="font-semibold text-orange-700">
                              {parseFloat(message.counterOffer).toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
