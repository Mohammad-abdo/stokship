import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

export default function OrderCheckoutComponent() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const products = useMemo(
    () => [
      {
        id: "p1",
        title: "فلتر زيت أصلي",
        sku: "6563453454",
        desc:
          "لوريم إيبسوم نص تجريبي يمكن استبداله بوصف المنتج الحقيقي. تفاصيل مختصرة عن المنتج ومواصفاته.",
        qtyTotal: 50,
        cbmTotal: 8,
        totalPrice: 1000,
        currency: "ر.س",
        mainImg:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
        thumbs: [
          "https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=300&q=80",
          "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?auto=format&fit=crop&w=300&q=80",
          "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=300&q=80",
          "https://images.unsplash.com/photo-1565843708714-52ecf69c36b1?auto=format&fit=crop&w=300&q=80",
        ],
      },
      {
        id: "p2",
        title: "فلتر زيت أصلي",
        sku: "6563453454",
        desc:
          "لوريم إيبسوم نص تجريبي يمكن استبداله بوصف المنتج الحقيقي. تفاصيل مختصرة عن المنتج ومواصفاته.",
        qtyTotal: 50,
        cbmTotal: 8,
        totalPrice: 1000,
        currency: "ر.س",
        mainImg:
          "https://images.unsplash.com/photo-1565843708714-52ecf69c36b1?auto=format&fit=crop&w=900&q=80",
        thumbs: [
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80",
          "https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=300&q=80",
          "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?auto=format&fit=crop&w=300&q=80",
          "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=300&q=80",
        ],
      },
    ],
    []
  );

  // ✅ selected image لكل منتج
  const [selectedImages, setSelectedImages] = useState(() =>
    Object.fromEntries(products.map((p) => [p.id, p.mainImg]))
  );

  const setSelectedFor = (productId, img) => {
    setSelectedImages((prev) => ({ ...prev, [productId]: img }));
  };

  const [rows, setRows] = useState([
      { serial: 1, itemNo: 1, qty: 1, price: 1, cbm: 1 },
      { serial: 2, itemNo: 2, qty: 2, price: 2, cbm: 2 },
      { serial: 3, itemNo: 8, qty: 3, price: 3, cbm: 3 },
      { serial: 5, itemNo: 5, qty: 6, price: 6, cbm: 6 },
    ]);
  

  const totals = useMemo(() => {
    const sumQty = rows.reduce((a, r) => a + Number(r.qty || 0), 0);
    const sumPrice = rows.reduce((a, r) => a + Number(r.price || 0), 0);
    const sumCbm = rows.reduce((a, r) => a + Number(r.cbm || 0), 0);
    return { sumQty, sumPrice, sumCbm };
  }, [rows]);

  const updateRow = (idx, key, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    );
  };
   
const [coupon, setCoupon] = useState("");

  const subtotal = 4589;
  const shipping = 45.0;
  const total = 4589;

  return (
    <div dir={currentDir} className="min-h-screen bg-white mt-40 w-full">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-25">
        
        {/* Navigation Links */}
        <div className={`mb-6 flex flex-wrap items-center gap-4 text-sm ${currentDir === 'rtl' ? '' : 'flex-row-reverse'}`}>
          <Link
            to={ROUTES.HOME}
            className="text-blue-900 hover:text-blue-700 hover:underline"
          >
            {t("checkout.homePage")}
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            to={ROUTES.PRODUCTS_LIST}
            className="text-blue-900 hover:text-blue-700 hover:underline"
          >
            {t("checkout.products")}
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            to={ROUTES.ORDERS}
            className="text-blue-900 hover:text-blue-700 hover:underline"
          >
            {t("checkout.myOrders")}
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-semibold">{t("checkout.title")}</span>
        </div>
        
        <div className="space-y-6">
          {products.map((p) => {
            const activeImg = selectedImages[p.id] || p.mainImg;

            return (
              <div
                key={p.id}
                className="rounded-md  border-slate-200 bg-white"
              >
                
                <div
                  className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-4 p-4 sm:p-6"
                  dir={currentDir}
                >
                  {/* LEFT: text + summary */}
                  <div dir={currentDir}>
                    <div className={`flex items-start gap-3 ${currentDir === 'rtl' ? 'justify-between' : 'justify-between'}`}>
                      <div className="flex-1">
                        <h3 className={`text-lg sm:text-xl font-bold text-slate-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          {p.title}
                        </h3>
                        <div className={`mt-1 text-xs text-slate-500 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                          #{p.sku}
                        </div>
                      </div>
                    </div>

                    <p className={`mt-3 text-sm leading-7 text-slate-600 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {p.desc}
                    </p>

                    {/* Summary rows */}
                    <div className="mt-4 overflow-hidden rounded-md border border-slate-200" dir={currentDir}>
                      {[
                        { label: t("checkout.totalQuantity"), value: `${p.qtyTotal} ${t("checkout.piece")}` },
                        { label: t("checkout.totalCbm"), value: `${p.cbmTotal} CBM` },
                        { label: t("checkout.totalPrice"), value: `${p.totalPrice} ${i18n.language === 'ar' ? 'ر.س' : 'SAR'}` },
                      ].map((row, idx) => (
                        <div
                          key={row.label}
                          className={`grid grid-cols-2 ${idx !== 0 ? "border-t border-slate-200" : ""}`}
                        >
                          <div className={`px-4 py-2.5 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`} dir={currentDir}>
                            {row.value}
                          </div>

                          <div
                            className={`px-4 py-2.5 text-sm font-semibold text-blue-800 bg-slate-50 border-slate-200 ${currentDir === 'rtl' ? 'text-right border-l' : 'text-left border-r'}`}
                            dir={currentDir}
                          >
                            {row.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: image + thumbs */}
                  <div className={`flex flex-col ${currentDir === 'rtl' ? 'items-end' : 'items-start'}`}>
                    <div className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      
                      <img
                        src={activeImg}
                        alt={p.title}
                        className="h-36 sm:h-40 w-full object-cover"
                      />
                      <span className={`absolute top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white ${currentDir === 'rtl' ? 'left-2' : 'right-2'}`}>
                        SALE
                      </span>
                    </div>

                    {/* ✅ thumbnails clickable */}
                    <div className="mt-2 grid grid-cols-5 gap-1 w-full">
                      {p.thumbs.slice(0, 4).map((thumb, i) => {
                        const isActive = activeImg === thumb;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedFor(p.id, thumb)}
                            className={`h-10 overflow-hidden rounded border bg-slate-50 transition
                              ${isActive ? "border-blue-700 ring-2 ring-blue-200" : "border-slate-200 hover:border-slate-400"}`}
                            aria-label={t("checkout.viewImage")}
                          >
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}

                      
                      <button
                        type="button"
                        onClick={() => setSelectedFor(p.id, p.mainImg)}
                        className="h-10 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        aria-label={t("checkout.backToMainImage")}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <section className="w-full mt-8">
          <div className={`text-lg font-bold text-slate-900 mb-4 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("checkout.orderSummary")}
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200" dir={currentDir}>
            <div className="grid grid-cols-5 bg-blue-50 text-sm font-semibold text-slate-800">
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("checkout.serial")}</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("checkout.itemNumber")}</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("checkout.quantity")}</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("checkout.price")}</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>CBM</div>
            </div>

            <div className="bg-white">
              {rows.map((r, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-5 items-center border-t border-slate-200 min-h-[74px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <div className={`px-3 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <input
                      value={r.serial}
                      onChange={(e) => updateRow(idx, "serial", e.target.value)}
                      className={`w-full rounded-md bg-white border border-slate-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                      dir={currentDir}
                    />
                  </div>

                  <div className={`px-3 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right border-r' : 'text-left border-l'} border-slate-200`}>
                    <input
                      value={r.itemNo}
                      onChange={(e) => updateRow(idx, "itemNo", e.target.value)}
                      className={`w-full rounded-md bg-white border border-slate-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                      dir={currentDir}
                    />
                  </div>

                  <div className={`px-3 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right border-r' : 'text-left border-l'} border-slate-200`}>
                    {r.qty}
                  </div>

                  <div className={`px-3 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right border-r' : 'text-left border-l'} border-slate-200`}>
                    {r.price} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                  </div>

                  <div className={`px-3 py-3 text-sm text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {r.cbm}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 bg-blue-900 text-white text-sm font-semibold">
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{t("checkout.total")}</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>........</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>{totals.sumQty}</div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {totals.sumPrice} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
              </div>
              <div className={`px-3 py-3 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>2222</div>
            </div>
          </div>

          <div className={`mt-3 text-sm font-semibold text-blue-900 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("checkout.siteFee")}
          </div>
        </section>
        {/* Cart summary */}
        <section className="w-full mt-8">
          <div className={`text-lg font-bold text-slate-900 mb-4 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {t("checkout.cart")}
          </div>

          <div className="w-full rounded-md border border-slate-200 overflow-hidden" dir={currentDir}>
            <div className={`flex items-stretch ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={t("checkout.enterCouponCode")}
                className={`flex-1 px-4 py-3 text-sm outline-none ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}
                dir={currentDir}
              />
              <button
                type="button"
                className={`w-24 border-slate-200 text-sm font-semibold text-blue-700 hover:bg-slate-50 transition-colors ${currentDir === 'rtl' ? 'border-l' : 'border-r'}`}
              >
                {t("checkout.save")}
              </button>
            </div>
          </div>

          <div className={`mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`} dir={currentDir}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{t("checkout.subtotal")}</span>
                <span className="text-sm font-semibold text-slate-900">{i18n.language === 'ar' ? 'ر.س' : '$'}{subtotal}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{t("checkout.shipping")}</span>
                <span className="text-sm font-semibold text-slate-900">{i18n.language === 'ar' ? 'ر.س' : '$'}{shipping.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-300 pt-3 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">{t("checkout.total")}</span>
                <span className="text-base font-bold text-blue-900">{i18n.language === 'ar' ? 'ر.س' : '$'}{total}</span>
              </div>
            </div>
          </div>
          
          <Link to={ROUTES.ORDER_CHECKOUT_TWO}>
            <button
              type="button"
              className="mt-6 w-full rounded-md bg-amber-500 px-4 py-4 text-base font-bold text-blue-900 hover:bg-amber-600 transition-colors"
            >
              {t("checkout.completePurchase")}
            </button>
          </Link>
        </section>

        {/* Additional Navigation Links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to={ROUTES.HOME}
            className="px-6 py-2 text-sm font-semibold text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t("checkout.backToHome")}
          </Link>
          <Link
            to={ROUTES.PRODUCTS_LIST}
            className="px-6 py-2 text-sm font-semibold text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t("checkout.browseMoreProducts")}
          </Link>
          <Link
            to={ROUTES.ORDERS}
            className="px-6 py-2 text-sm font-semibold text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition-colors"
          >
            {t("checkout.viewMyOrders")}
          </Link>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
