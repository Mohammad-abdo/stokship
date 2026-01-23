import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Star, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { profileService } from "../services/profileService";
import { offerService } from "../services/offerService";
import { ROUTES } from "../routes";

const StarRating = ({ value = 5 }) => {
  const { t } = useTranslation();
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div
      className="flex items-center justify-center gap-1 text-amber-500"
      aria-label={`${t("productDetails.rating")} ${value} ${t("common.of")} 5`}
    >
      {stars.map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= value ? "fill-current" : ""}`}
        />
      ))}
      <span className="ms-2 text-xs text-slate-500">({value.toFixed(1)})</span>
    </div>
  );
};

export default function CompanyAdsComponent({ traderId }) {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  
  const [trader, setTrader] = useState(null);
  const [offers, setOffers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    all: false,
    featured: false,
    available: false,
    latest: true,
  });

  useEffect(() => {
    if (traderId) {
      fetchTraderData();
    } else {
      setLoading(false);
    }
  }, [traderId]);

  const fetchTraderData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching trader data for ID:", traderId);
      
      // Fetch trader profile
      const traderResponse = await profileService.getTraderById(traderId);
      console.log("📦 Full trader response:", traderResponse);
      console.log("📦 Response.data:", traderResponse?.data);
      console.log("📦 Response.data.data:", traderResponse?.data?.data);
      console.log("📦 Response.data.success:", traderResponse?.data?.success);
      
      let traderData = null;
      
      // Handle different response structures
      if (traderResponse && traderResponse.data) {
        // Standard success response: { success: true, data: {...}, message: "..." }
        if (traderResponse.data.success && traderResponse.data.data) {
          traderData = traderResponse.data.data;
          console.log("✅ Found trader in response.data.data");
        }
        // Direct data response: { data: {...} }
        else if (traderResponse.data.id || traderResponse.data.companyName || traderResponse.data.name) {
          traderData = traderResponse.data;
          console.log("✅ Found trader in response.data");
        }
        // Nested structure: { data: { data: {...} } }
        else if (traderResponse.data.data) {
          traderData = traderResponse.data.data;
          console.log("✅ Found trader in response.data.data");
        }
      }
      
      // Validate trader data has required fields
      if (traderData && (traderData.id || traderData.companyName || traderData.name)) {
        console.log("✅ Trader data loaded successfully!");
        console.log("✅ Trader ID:", traderData.id);
        console.log("✅ Company Name:", traderData.companyName || traderData.name);
        console.log("✅ Trader Code:", traderData.traderCode);
        console.log("✅ Country:", traderData.country);
        console.log("✅ City:", traderData.city);
        console.log("✅ Is Active:", traderData.isActive);
        console.log("✅ Is Verified:", traderData.isVerified);
        console.log("✅ Counts:", traderData._count);
        console.log("✅ Full trader object:", JSON.stringify(traderData, null, 2));
        setTrader(traderData);
        
        // Fetch trader offers
        const offersResponse = await profileService.getTraderOffers(traderId, { limit: 20 });
        console.log("Offers response:", offersResponse);
        
        let offersData = [];
        if (offersResponse.data) {
          // Handle paginated response: { success: true, data: [...], pagination: {...} }
          if (offersResponse.data.success) {
            if (Array.isArray(offersResponse.data.data)) {
              offersData = offersResponse.data.data;
            } else if (offersResponse.data.data?.data && Array.isArray(offersResponse.data.data.data)) {
              offersData = offersResponse.data.data.data;
            }
          } 
          // Handle direct array response
          else if (Array.isArray(offersResponse.data)) {
            offersData = offersResponse.data;
          }
          // Handle nested data structure
          else if (offersResponse.data.data && Array.isArray(offersResponse.data.data)) {
            offersData = offersResponse.data.data;
          }
        }
        
        console.log("✅ Offers data loaded:", offersData);
        setOffers(offersData);
        
        // Extract top product images from offers (first 5)
        const productImages = [];
        offersData.slice(0, 5).forEach(offer => {
          if (offer.images) {
            try {
              const parsedImages = typeof offer.images === 'string' 
                ? JSON.parse(offer.images) 
                : offer.images;
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                const imageUrl = typeof parsedImages[0] === 'string' 
                  ? parsedImages[0] 
                  : (parsedImages[0]?.url || parsedImages[0]?.src || parsedImages[0]);
                if (imageUrl) {
                  productImages.push({
                    id: offer.id,
                    img: imageUrl.startsWith('http') 
                      ? imageUrl 
                      : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl.startsWith('/') ? imageUrl : '/uploads/' + imageUrl}`
                  });
                }
              }
            } catch (e) {
              console.warn("Error parsing offer images:", e);
            }
          }
        });
        
        // Fill remaining slots with placeholder if needed
        while (productImages.length < 5) {
          productImages.push({
            id: `placeholder-${productImages.length}`,
            img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
          });
        }
        
        setTopProducts(productImages.slice(0, 5));
      } else {
        console.error("❌ No valid trader data found in response!");
        console.error("Response analysis:", {
          hasResponse: !!traderResponse,
          hasResponseData: !!traderResponse?.data,
          hasResponseDataData: !!traderResponse?.data?.data,
          hasResponseDataSuccess: traderResponse?.data?.success,
          responseDataMessage: traderResponse?.data?.message,
          responseDataType: typeof traderResponse?.data,
          responseDataKeys: traderResponse?.data ? Object.keys(traderResponse.data) : [],
          responseDataHasId: !!traderResponse?.data?.id,
          responseDataHasCompanyName: !!traderResponse?.data?.companyName,
          responseDataDataHasId: !!traderResponse?.data?.data?.id,
          responseDataDataHasCompanyName: !!traderResponse?.data?.data?.companyName,
          fullResponse: JSON.stringify(traderResponse, null, 2)
        });
        setTrader(null);
      }
    } catch (error) {
      console.error("❌ Error fetching trader data:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);
      console.error("Request URL:", error.config?.url);
      console.error("Request method:", error.config?.method);
      
      // If 404, trader doesn't exist
      if (error.response?.status === 404) {
        console.error("❌ Trader not found (404)");
      } else if (error.response?.status === 403) {
        console.error("❌ Access forbidden (403)");
      } else if (error.response?.status >= 500) {
        console.error("❌ Server error (500+)");
      }
      
      setTrader(null);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (k) => setFilters((p) => ({ ...p, [k]: !p[k] }));

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');
    return `${BASE_URL}${imagePath.startsWith('/') ? imagePath : '/uploads/' + imagePath}`;
  };

  if (loading) {
    return (
      <div dir={currentDir} className="min-h-screen bg-white mt-25">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 pt-30">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-500">جاري التحميل...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!traderId) {
    return (
      <div dir={currentDir} className="min-h-screen bg-white mt-25">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 pt-30">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">
              {i18n.language === 'ar' ? 'معرف الشركة غير محدد' : 'Company ID not specified'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trader) {
    return (
      <div dir={currentDir} className="min-h-screen bg-white mt-25">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 pt-30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-slate-500 text-lg mb-2">
              {i18n.language === 'ar' ? 'الشركة غير موجودة' : 'Company not found'}
            </div>
            <div className="text-slate-400 text-sm">
              {i18n.language === 'ar' 
                ? `معرف الشركة: ${traderId}` 
                : `Company ID: ${traderId}`}
            </div>
            <div className="text-slate-400 text-xs mt-2">
              {i18n.language === 'ar' 
                ? 'تحقق من وحدة تحكم المتصفح للحصول على مزيد من التفاصيل' 
                : 'Check browser console for more details'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={currentDir} className="min-h-screen bg-white mt-25">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 pt-30">
        {/* Top products strip (GRID responsive) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {topProducts.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-md border border-slate-200 bg-white"
            >
              <div className="relative">
                <img
                  src={p.img}
                  alt="product"
                  className="w-full h-24 sm:h-28 md:h-32 lg:h-36 object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80";
                  }}
                />
                <div className="absolute top-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-700">
                  {trader.companyName?.substring(0, 8).toUpperCase() || 'PRODUCT'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company header */}
        <div className="mt-10 mb-5 flex flex-col items-center">
          <div className="h-12 w-12 rounded-md bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center overflow-hidden">
            <img
              alt="company"
              src="https://images.unsplash.com/photo-1519337265831-281ec6cc8514?auto=format&fit=crop&w=200&q=80"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?auto=format&fit=crop&w=200&q=80";
              }}
            />
          </div>

          <div className="mt-2 text-center">
            <div className="text-xs font-semibold text-slate-900">
              {trader.companyName || trader.name || 'COMPANY NAME'}
            </div>
            <div className="mt-1">
              <StarRating value={5} />
            </div>
          </div>
        </div>

        {/* Filters + Title */}
        <div className="mt-4 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-2xl font-bold">
              {i18n.language === 'ar' ? 'إعلانات الشركة' : 'Company Ads'}
            </div>

            <div className="flex flex-wrap items-center justify-around gap-4 text-lg text-slate-900 w-[70%]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.all}
                  onChange={() => toggle("all")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {t("categories.all")}
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.available}
                  onChange={() => toggle("available")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {t("products.available")}
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={() => toggle("featured")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {i18n.language === 'ar' ? 'مميز' : 'Featured'}
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.latest}
                  onChange={() => toggle("latest")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {t("categories.latest")}
              </label>
            </div>
          </div>
        </div>

        {/* Offers */}
        <div className={`mt-4 text-lg font-bold text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
          {i18n.language === 'ar' ? 'العروض' : 'Offers'}
        </div>

        <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
          {offers.length > 0 ? (
            offers.map((o, idx) => {
              // Get first image from offer
              let offerImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
              if (o.images) {
                try {
                  const parsedImages = typeof o.images === 'string' ? JSON.parse(o.images) : o.images;
                  if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    const imgUrl = typeof parsedImages[0] === 'string' ? parsedImages[0] : (parsedImages[0]?.url || parsedImages[0]?.src);
                    if (imgUrl) {
                      offerImage = getImageUrl(imgUrl);
                    }
                  }
                } catch (e) {
                  console.warn("Error parsing offer image:", e);
                }
              }
              
              return (
                <Link key={o.id} to={`${ROUTES.OFFER_DETAILS}/${o.id}`}>
                  <div
                    className={`p-3 sm:p-4 hover:bg-slate-50 transition ${
                      idx !== offers.length - 1 ? "border-b border-slate-200" : ""
                    }`}
                    dir={currentDir}
                  >
                    <div className={`flex gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      {/* Thumbnail */}
                      <div className="relative h-30 w-30 sm:h-30 sm:w-30 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 shrink-0">
                        <img
                          src={offerImage}
                          alt={o.title || 'Offer'}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                        <div className={`absolute top-1 rounded bg-white/90 px-1 py-0.5 text-[8px] font-bold text-red-600 ${currentDir === 'rtl' ? 'left-1' : 'right-1'}`}>
                          {o.status === 'ACTIVE' ? (i18n.language === 'ar' ? 'متاح' : 'AVAILABLE') : o.status}
                        </div>
                      </div>

                      {/* Text */}
                      <div className="flex-1" dir={currentDir}>
                        <div className="text-lg font-semibold text-slate-900">
                          {o.title || (i18n.language === 'ar' ? 'عرض' : 'Offer')}
                        </div>
                        <p className="mt-1 text-lg sm:text-sm leading-6 text-slate-900">
                          {o.description || (i18n.language === 'ar' 
                            ? 'لا يوجد وصف متوفر' 
                            : 'No description available')}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-lg text-slate-700">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {[o.city || trader.city, o.country || trader.country]
                              .filter(Boolean)
                              .join(' - ') || (i18n.language === 'ar' ? 'الموقع غير محدد' : 'Location not specified')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-500">
              {i18n.language === 'ar' ? 'لا توجد عروض متاحة' : 'No offers available'}
            </div>
          )}
        </div>

        {/* Bottom details table */}
        <div
          className="mt-4 overflow-hidden rounded-md border border-slate-200"
          dir={currentDir}
        >
          {[
            [trader.traderCode || trader.id || 'N/A', i18n.language === 'ar' ? "رقم التحقق" : "Verification Number"],
            [trader.isVerified ? (i18n.language === 'ar' ? 'موثق' : 'Verified') : (i18n.language === 'ar' ? 'غير موثق' : 'Not Verified'), i18n.language === 'ar' ? "حالة التحقق" : "Verification Status"],
            ["5.0", i18n.language === 'ar' ? "تقييم الشركة" : "Company Rating"],
            [`${trader._count?.offers || 0} ${i18n.language === 'ar' ? 'عروض' : 'offers'}`, i18n.language === 'ar' ? "عدد العروض" : "Number of Offers"],
            [`${trader._count?.deals || 0} ${i18n.language === 'ar' ? 'صفقات' : 'deals'}`, i18n.language === 'ar' ? "عدد الصفقات" : "Number of Deals"],
          ].map(([val, key], i, arr) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_120px] md:grid-cols-[1fr_160px] ${
                i !== arr.length - 1 ? "border-b border-slate-200" : ""
              }`}
            >
              {/* Value */}
              <div className={`px-4 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`} dir={currentDir}>
                {key.includes("Rating") || key.includes("تقييم") ? (
                  <div className={`flex items-center gap-2 text-amber-500 ${currentDir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-slate-700 text-sm">{val}</span>
                  </div>
                ) : (
                  val
                )}
              </div>

              {/* Key */}
              <div
                className={`px-4 py-3 text-sm font-semibold bg-slate-50 border-slate-200 text-slate-700 ${currentDir === 'rtl' ? 'border-l text-right' : 'border-r text-left'}`}
                dir={currentDir}
              >
                {key}
              </div>
            </div>
          ))}
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
