import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES, getCompanyProfileUrl } from "../routes";
import { offerService } from "../services/offerService";
import { dealService } from "../services/dealService";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "../components/Layout";
import { Clock, CheckCircle, XCircle, MessageSquare, Building2 } from "lucide-react";

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
    'CANCELLED': { 
      label: t("negotiations.status.cancelled") || "ملغي", 
      className: "bg-slate-100 text-slate-900",
      icon: XCircle
    },
  };
  
  return statusMap[status] || { 
    label: status, 
    className: "bg-slate-100 text-slate-900",
    icon: Clock
  };
};

export default function NegotiationsPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");

  useEffect(() => {
    if (isAuthenticated) {
      fetchNegotiations();
    }
  }, [isAuthenticated]);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const response = await offerService.getMyNegotiations();
      
      if (response.data && response.data.success) {
        // The response contains deals with NEGOTIATION status
        // Transform deals to negotiation format
        const dealsData = response.data.data || [];
        const negotiationsData = dealsData.map(deal => ({
          id: deal.id,
          dealId: deal.id,
          offerId: deal.offerId,
          status: deal.status === 'NEGOTIATION' ? 'PENDING' : 
                  deal.status === 'APPROVED' ? 'ACCEPTED' : 
                  deal.status === 'REJECTED' ? 'REJECTED' : 
                  deal.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
          offer: deal.offer,
          trader: deal.trader,
          items: deal.items || [],
          notes: deal.notes,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt
        }));
        
        setNegotiations(negotiationsData);
      }
    } catch (error) {
      console.error("Error fetching negotiations:", error);
      setNegotiations([]);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { key: "all", label: t("negotiations.tabs.all") || "الكل" },
    { key: "PENDING", label: t("negotiations.tabs.pending") || "قيد الانتظار" },
    { key: "ACCEPTED", label: t("negotiations.tabs.accepted") || "مقبول" },
    { key: "REJECTED", label: t("negotiations.tabs.rejected") || "مرفوض" },
  ];

  const filteredNegotiations = activeStatus === "all" 
    ? negotiations 
    : negotiations.filter(n => n.status === activeStatus);

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white mt-40">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
            <div className="text-center text-slate-600">
              {t("negotiations.notAuthenticated") || "يجب تسجيل الدخول لعرض طلبات التفاوض"}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-white mt-40">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 mb-6 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("negotiations.title") || "طلبات التفاوض"}
          </h1>

          <div className={`flex items-center justify-start gap-3 mb-6 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
            {TABS.map((tab) => {
              const active = activeStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveStatus(tab.key)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-100 text-blue-900"
                      : "bg-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="mt-6 text-center py-12">
              <div className="text-slate-500">{t("common.loading") || "جاري التحميل..."}</div>
            </div>
          ) : filteredNegotiations.length === 0 ? (
            <div className="mt-6 text-center py-12">
              <div className="text-slate-500">
                {t("negotiations.noNegotiations") || "لا توجد طلبات تفاوض"}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {filteredNegotiations.map((negotiation, idx) => {
                const badge = getStatusBadge(negotiation.status, t);
                const StatusIcon = badge.icon;

                return (
                  <div
                    key={negotiation.id || idx}
                    className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200 px-5 py-5"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusIcon className={`h-5 w-5 ${badge.className.split(' ')[1]}`} />
                          <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>

                        {negotiation.offer && (
                          <div className="mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {negotiation.offer.title || t("negotiations.offer") || "عرض"}
                            </h3>
                          </div>
                        )}

                        {negotiation.trader && (
                          <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <Building2 className="h-4 w-4" />
                            <Link
                              to={getCompanyProfileUrl(negotiation.trader.id)}
                              className="hover:text-blue-900 hover:underline"
                            >
                              {negotiation.trader.companyName || negotiation.trader.name || t("negotiations.trader") || "تاجر"}
                            </Link>
                          </div>
                        )}

                        {negotiation.items && negotiation.items.length > 0 && (
                          <div className="mt-3 text-sm text-slate-600">
                            <span className="font-semibold">{t("negotiations.itemsCount") || "عدد العناصر"}: </span>
                            {negotiation.items.length}
                          </div>
                        )}

                        {negotiation.notes && (
                          <div className="mt-3 flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                            <p className="text-sm text-slate-600">{negotiation.notes}</p>
                          </div>
                        )}

                        {negotiation.createdAt && (
                          <div className="mt-2 text-xs text-slate-500">
                            {t("negotiations.requestedAt") || "تاريخ الطلب"}: {new Date(negotiation.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Negotiate Button */}
                        {(negotiation.status === 'PENDING' || negotiation.status === 'ACCEPTED') && (
                          <button
                            onClick={() => {
                              navigate(`${ROUTES.NEGOTIATION_DETAIL}/${negotiation.dealId}`, {
                                state: { deal: negotiation, negotiation: negotiation }
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                          >
                            <MessageSquare className="h-4 w-4" />
                            {t("negotiations.negotiate") || "التفاوض"}
                          </button>
                        )}

                        {/* Proceed to Checkout Button */}
                        {negotiation.status === 'ACCEPTED' && (
                          <button
                            onClick={async () => {
                            try {
                              let dealData = null;
                              let offerData = negotiation.offer;

                              // Try to fetch deal if dealId exists
                              if (negotiation.dealId) {
                                try {
                                  const dealResponse = await dealService.getDealById(negotiation.dealId);
                                  if (dealResponse.data?.success && dealResponse.data?.data) {
                                    dealData = dealResponse.data.data;
                                    // Use offer from deal if available
                                    if (dealData.offer) {
                                      offerData = dealData.offer;
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error fetching deal:', error);
                                }
                              }

                              // If no deal found but we have offerId, try to find deal by offerId
                              if (!dealData && negotiation.offerId) {
                                try {
                                  const dealsResponse = await dealService.getDeals({ offerId: negotiation.offerId });
                                  if (dealsResponse.data?.success && dealsResponse.data?.data?.length > 0) {
                                    dealData = dealsResponse.data.data[0];
                                    if (dealData.offer) {
                                      offerData = dealData.offer;
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error fetching deal by offerId:', error);
                                }
                              }

                              // If still no offer data, try to fetch offer by ID
                              if (!offerData && negotiation.offerId) {
                                try {
                                  const offerResponse = await offerService.getOfferById(negotiation.offerId);
                                  if (offerResponse.data?.success) {
                                    offerData = offerResponse.data.data?.offer || offerResponse.data.data;
                                  }
                                } catch (error) {
                                  console.error('Error fetching offer:', error);
                                }
                              }

                              // Navigate to checkout with all available data
                              navigate(ROUTES.ORDER_CHECKOUT, {
                                state: {
                                  offer: offerData,
                                  deal: dealData,
                                  negotiation: negotiation
                                }
                              });
                            } catch (error) {
                              console.error('Error preparing checkout:', error);
                              // Fallback: navigate with basic negotiation data
                              navigate(ROUTES.ORDER_CHECKOUT, {
                                state: {
                                  offer: negotiation.offer,
                                  negotiation: negotiation
                                }
                              });
                            }
                          }}
                            className="inline-block rounded-md bg-green-900 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 whitespace-nowrap"
                          >
                            {t("negotiations.proceedToCheckout") || "المتابعة للدفع"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
