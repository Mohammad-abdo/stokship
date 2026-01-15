import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, MapPin } from "lucide-react";

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

export default function CompanyAdsComponent() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  
  const topProducts = useMemo(
    () => [
      {
        id: 1,
        img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: 2,
        img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: 3,
        img: "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: 4,
        img: "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: 5,
        img: "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80",
      },
    ],
    []
  );

  const offers = useMemo(
    () => [
      {
        id: "o1",
        title: "ايفون",
        desc: "لوريم إيبسوم نص تجريبي ويمكن استبداله بوصف المنتج الحقيقي…",
        city: "الرياض - السعودية",
        img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "o2",
        title: "ايفون",
        desc: "لوريم إيبسوم نص تجريبي ويمكن استبداله بوصف المنتج الحقيقي…",
        city: "الرياض - السعودية",
        img: "https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "o3",
        title: "ايفون",
        desc: "لوريم إيبسوم نص تجريبي ويمكن استبداله بوصف المنتج الحقيقي…",
        city: "الرياض - السعودية",
        img: "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?auto=format&fit=crop&w=400&q=80",
      },
    ],
    []
  );

  const [filters, setFilters] = useState({
    all: false,
    featured: false,
    available: false,
    latest: true,
  });

  const toggle = (k) => setFilters((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div dir={currentDir} className="min-h-screen bg-white  mt-25">
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
                />
                <div className="absolute top-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-700">
                  APPL PRODUCT
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
            />
          </div>

          <div className="mt-2 text-center">
            <div className="text-xs font-semibold text-slate-900">
              APPLE CO.
            </div>
            <div className="mt-1">
              <StarRating value={5} />
            </div>
          </div>
        </div>

        {/* Filters + Title */}
        <div className="mt-4  pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-2xl font-bold ">
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
          {offers.map((o, idx) => (
            <div
              key={o.id}
              className={`p-3 sm:p-4 ${
                idx !== offers.length - 1 ? "border-b border-slate-200" : ""
              }`}
              dir={currentDir}
            >
              <div className={`flex gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                {/* Thumbnail */}
                <div className="relative h-30 w-30 sm:h-30 sm:w-30 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 shrink-0">
                  <img
                    src={o.img}
                    alt={o.title}
                    className="h-full w-full object-cover"
                  />
                  <div className={`absolute top-1 rounded bg-white/90 px-1 py-0.5 text-[8px] font-bold text-red-600 ${currentDir === 'rtl' ? 'left-1' : 'right-1'}`}>
                    FOR SALE
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1" dir={currentDir}>
                  <div className="text-lg font-semibold text-slate-900">
                    {o.title}
                  </div>
                  <p className="mt-1 text-lg sm:text-sm leading-6 text-slate-900">
                    {o.desc}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-lg text-slate-700">
                    <MapPin className="h-4 w-4" />
                    <span>{o.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom details table */}
        <div
          className="mt-4 overflow-hidden rounded-md border border-slate-200"
          dir={currentDir}
        >
          {[
            ["54364#", i18n.language === 'ar' ? "اسمه التجاري" : "Trade Name"],
            ["LC, T/T, D/P, PayPal, Western Union", i18n.language === 'ar' ? "الأنشطة و التخصصات" : "Activities & Specializations"],
            ["5.0", i18n.language === 'ar' ? "شروط الدفع:" : "Payment Terms:"],
            [i18n.language === 'ar' ? "هواتف والإلكترونيات" : "Phones and Electronics", i18n.language === 'ar' ? "شروط الشحن:" : "Shipping Terms:"],
            [i18n.language === 'ar' ? "هواتف والإلكترونيات" : "Phones and Electronics", i18n.language === 'ar' ? "متوسط الوقت الرصاص:" : "Average Lead Time:"],
          ].map(([val, key], i, arr) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_120px] md:grid-cols-[1fr_160px] ${
                i !== arr.length - 1 ? "border-b border-slate-200" : ""
              }`}
            >
              {/* Value */}
              <div className={`px-4 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`} dir={currentDir}>
                {key.includes("Payment Terms") || key.includes("شروط الدفع") ? (
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
