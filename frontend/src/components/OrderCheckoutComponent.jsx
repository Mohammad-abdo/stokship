import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../routes";

export default function OrderCheckoutComponent() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const location = useLocation();
  
  // Get offer from navigation state
  const offer = location.state?.offer;
  
  console.log("OrderCheckout: Received Offer:", JSON.stringify(offer, null, 2));
  console.log("OrderCheckout: Offer Items:", offer ? JSON.stringify(offer.items, null, 2) : "Offer is undefined");
  
  // Transform offer items to products format or use dummy if no offer
  const products = useMemo(() => {
    if (!offer || !offer.items) return [];
    
    // Group all items as one 'product' or map them individually? 
    // Usually an Offer IS a product in this context, or a collection.
    // Let's treat the Offer as the main entity, and items as parts.
    // However, the existing UI expects an array of products, each with thumbs.
    // We will map each Item as a Product if they have images, 
    // OR we can just map the whole Offer as one Product line.
    
    // The current UI shows "Product Title" and then a TABLE of items (rows).
    // So `products` array seems to be for the "Overview" section (top),
    // and `rows` is for the table.
    
    // Let's create a single 'product' representing the Offer.
    return [{
        id: offer.id,
        title: offer.title || t("productDetails.offerDefaultTitle"),
        sku: offer.id.substring(0, 8),
        desc: offer.description || t("productDetails.noDescription"),
        qtyTotal: offer.totalCartons || 0,
        cbmTotal: offer.totalCBM || 0,
        totalPrice: 0, // Calculated later
        currency: "USD",
        mainImg: (offer.images && offer.images.length > 0) ? offer.images[0] : "https://placehold.co/600x400?text=No+Image",
        thumbs: offer.images || [],
    }];
  }, [offer, t]);


  // ✅ selected image لكل منتج
  const [selectedImages, setSelectedImages] = useState(() =>
      Object.fromEntries(products.map((p) => [p.id, p.mainImg]))
  );

  // Initialize rows from offer items
  const [rows, setRows] = useState(() => {
    if (offer && offer.items) {
        return offer.items.map((item, index) => ({
            serial: index + 1,
            itemNo: item.itemNo || item.productName,
            qty: item.quantity || 0,
            price: item.unitPrice || 0,
            cbm: item.cbm || 0,
            // Keep original item reference if needed
            originalItem: item
        }));
    }
    return [];
  });

  const setSelectedFor = (productId, img) => {
    setSelectedImages((prev) => ({ ...prev, [productId]: img }));
  };


  

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

  const subtotal = totals.sumPrice;
  const shipping = 0; // Or calculate
  const total = subtotal + shipping;

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
                  className="flex flex-col md:flex-row gap-6 p-4 sm:p-6"
                  dir={currentDir}
                >
                   {/* RIGHT: image + thumbs (First in DOM -> Right in RTL) */}
                   <div className="w-full md:w-56 flex-shrink-0">
                    <div className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      <img
                        src={activeImg}
                        alt={p.title}
                        className="h-48 w-full object-cover"
                      />
                      <span className={`absolute top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white ${currentDir === 'rtl' ? 'right-2' : 'left-2'}`}>
                        SALE
                      </span>
                    </div>

                    {/* ✅ thumbnails clickable */}
                    <div className="mt-2 grid grid-cols-4 gap-2 w-full">
                      {p.thumbs.slice(0, 4).map((thumb, i) => {
                        const isActive = activeImg === thumb;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedFor(p.id, thumb)}
                            className={`h-12 overflow-hidden rounded border bg-slate-50 transition
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
                    </div>
                  </div>

                  {/* LEFT: text + summary */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                          {p.title}
                        </h3>
                        <div className="text-sm text-slate-500 mb-4">
                          #{p.sku}
                        </div>
                      </div>
                    </div>

                    <p className="text-base leading-relaxed text-slate-600 mb-6">
                      {p.desc}
                    </p>

                  {/* Summary rows */}
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      {[
                        { label: t("checkout.totalQuantity"), value: `${p.qtyTotal} ${t("checkout.piece")}` },
                        { label: t("checkout.totalCbm"), value: `${p.cbmTotal} CBM` },
                        { label: t("checkout.totalPrice"), value: `${p.totalPrice} ${i18n.language === 'ar' ? 'ر.س' : 'SAR'}` },
                      ].map((row, idx) => (
                        <div
                          key={row.label}
                          className={`flex items-center justify-between px-4 py-3 ${idx !== 0 ? "border-t border-slate-200" : ""} bg-white`}
                        >
                           {/* Label first = Right in RTL */}
                           <div className="font-bold text-blue-900">
                            {row.label}
                          </div>
                          
                          {/* Value second = Left in RTL */}
                          <div className="text-slate-700 font-medium">
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary table */}
        <section className="w-full mt-10">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-blue-900">{t("checkout.orderSummary")}</h2>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            {/* Header */}
            <div className="grid grid-cols-5 bg-blue-50 text-sm font-bold text-slate-800 border-b border-slate-200">
              <div className="px-4 py-4 text-center">{t("checkout.serial")}</div>
              <div className="px-4 py-4 text-center">{t("checkout.itemNumber")}</div>
              <div className="px-4 py-4 text-center">{t("checkout.quantity")}</div>
              <div className="px-4 py-4 text-center">{t("checkout.price")}</div>
              <div className="px-4 py-4 text-center">CBM</div>
            </div>

            {/* Rows */}
            <div className="bg-white divide-y divide-slate-100">
              {rows.map((r, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 items-center py-3 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="px-2 text-center">
                    <input
                      value={r.serial}
                      onChange={(e) => updateRow(idx, "serial", e.target.value)}
                      className="mx-auto w-16 block text-center bg-blue-50 text-blue-900 font-medium py-1.5 rounded-md border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="px-2 text-center">
                    <input
                      value={r.itemNo}
                      onChange={(e) => updateRow(idx, "itemNo", e.target.value)}
                       className="mx-auto w-24 block text-center bg-blue-50 text-blue-900 font-medium py-1.5 rounded-md border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="px-2 text-center">
                    <input
                      value={r.qty}
                      onChange={(e) => updateRow(idx, "qty", e.target.value)}
                       className="mx-auto w-24 block text-center bg-blue-50 text-blue-900 font-medium py-1.5 rounded-md border border-blue-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="px-2 text-center font-semibold text-slate-700 text-sm">
                    {r.price}
                  </div>

                  <div className="px-2 text-center font-semibold text-slate-700 text-sm">
                     {r.cbm}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Total */}
            <div className="grid grid-cols-5 bg-[#1E3A8A] text-white text-sm font-bold">
              <div className="px-4 py-4 text-center">{t("checkout.total")}</div>
              <div className="px-4 py-4 text-center">......</div>
              <div className="px-4 py-4 text-center">{totals.sumQty}</div>
              <div className="px-4 py-4 text-center">
                {totals.sumPrice} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
              </div>
              <div className="px-4 py-4 text-center">{totals.sumCbm || 2222}</div>
            </div>
          </div>
        </section>
        {/* Cart summary */}
        <section className="w-full mt-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{t("checkout.cart")}</h2>

          <div className="w-full rounded-md border border-slate-200 overflow-hidden bg-white">
            <div className="flex items-stretch">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={t("checkout.enterCouponCode")}
                className={`flex-1 px-4 py-3 text-sm outline-none bg-white text-slate-700 placeholder:text-slate-400`}
                dir={currentDir}
              />
              <button
                type="button"
                className={`px-6 border-slate-200 text-sm font-semibold text-blue-700 hover:bg-slate-50 transition-colors border-l rtl:border-r rtl:border-l-0`}
              >
                {t("checkout.save")}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
             {/* Totals Block */}
            <div className="flex items-center justify-between text-base font-semibold text-slate-800">
               <span>{t("checkout.subtotal")}</span>
               <span>{subtotal} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            
            <div className="flex items-center justify-between text-base font-semibold text-slate-800">
               <span>{t("checkout.shipping")}</span>
               <span>{shipping.toFixed(2)} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            
             <div className="flex items-center justify-between text-base font-bold text-slate-900 pt-2">
               <span>{t("checkout.total")}</span>
               <span>{total} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
          
          <Link to={ROUTES.ORDER_CHECKOUT_TWO} className="block mt-8">
            <button
              type="button"
              className="w-full rounded-md bg-[#F59E0B] px-4 py-4 text-center text-lg font-bold text-blue-900 hover:bg-[#D97706] transition-colors shadow-sm"
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
