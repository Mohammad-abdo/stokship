import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Header from "../components/Header";
import FooterArabic from "../components/FooterArabic";
import { ROUTES } from "../routes";

export default function SellerProductsPage() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");

  // Sample products data
  const products = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80",
      thumbnails: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
        "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=100&q=80",
      ],
      title: "فلتر زيت أصلي",
      itemNumber: "#item number",
      country: "🇨🇳",
      description: "لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسينج إيليت، سيد دو إيوسمود تيمبور إينسيديدونت.",
      quantity: 500,
      piecesPerCarton: 101,
      pricePerPiece: 700,
      cbm: 8,
      soldOut: false,
      negotiationPrice: "",
      negotiationQuantity: "",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80",
      thumbnails: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
        "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=100&q=80",
      ],
      title: "فلتر زيت أصلي",
      itemNumber: "#item number",
      country: "🇨🇳",
      description: "لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسينج إيليت، سيد دو إيوسمود تيمبور إينسيديدونت.",
      quantity: 500,
      piecesPerCarton: 101,
      pricePerPiece: 700,
      cbm: 8,
      soldOut: false,
      negotiationPrice: "",
      negotiationQuantity: "",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80",
      thumbnails: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
        "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=100&q=80",
      ],
      title: "فلتر زيت أصلي",
      itemNumber: "#item number",
      country: "🇨🇳",
      description: "لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسينج إيليت، سيد دو إيوسمود تيمبور إينسيديدونت.",
      quantity: 500,
      piecesPerCarton: 101,
      pricePerPiece: 100,
      cbm: 8,
      soldOut: true,
      negotiationPrice: 100,
      negotiationQuantity: 30,
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80",
      thumbnails: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
        "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=100&q=80",
      ],
      title: "فلتر زيت أصلي",
      itemNumber: "#item number",
      country: "🇨🇳",
      description: "لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسينج إيليت، سيد دو إيوسمود تيمبور إينسيديدونت.",
      quantity: 500,
      piecesPerCarton: 101,
      pricePerPiece: 700,
      cbm: 8,
      soldOut: false,
      negotiationPrice: "",
      negotiationQuantity: "",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80",
      thumbnails: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
        "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=100&q=80",
      ],
      title: "فلتر زيت أصلي",
      itemNumber: "#item number",
      country: "🇨🇳",
      description: "لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسينج إيليت، سيد دو إيوسمود تيمبور إينسيديدونت.",
      quantity: 500,
      piecesPerCarton: 101,
      pricePerPiece: 700,
      cbm: 8,
      soldOut: false,
      negotiationPrice: "",
      negotiationQuantity: "",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&q=80",
      thumbnails: [
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
        "https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=100&q=80",
      ],
      title: "فلتر زيت أصلي",
      itemNumber: "#item number",
      country: "🇨🇳",
      description: "لوريم إيبسوم دولور سيت أميت، كونسيكتيتور أديبيسينج إيليت، سيد دو إيوسمود تيمبور إينسيديدونت.",
      quantity: 500,
      piecesPerCarton: 101,
      pricePerPiece: 100,
      cbm: 5,
      soldOut: true,
      negotiationPrice: 100,
      negotiationQuantity: 30,
    },
  ];

  const [productData, setProductData] = useState(products);

  const handleNegotiationChange = (productId, field, value) => {
    setProductData((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const calculateTotals = () => {
    const selectedProducts = productData.filter(
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

    // Add sold out items
    productData
      .filter((p) => p.soldOut)
      .forEach((p) => {
        totalQuantity += p.negotiationQuantity || 0;
        totalPrice += (p.negotiationQuantity || 0) * (p.negotiationPrice || 0);
        totalCbm += ((p.negotiationQuantity || 0) / p.quantity) * p.cbm;
      });

    return { totalQuantity, totalPrice, totalCbm };
  };

  const { totalQuantity, totalPrice, totalCbm } = calculateTotals();

  const summaryData = productData
    .filter((p) => p.soldOut || p.negotiationQuantity || p.negotiationPrice)
    .map((p) => ({
      id: p.id,
      itemNumber: p.id,
      quantity: p.soldOut ? p.negotiationQuantity : p.negotiationQuantity || 1,
      price: p.soldOut ? p.negotiationPrice : p.negotiationPrice || p.pricePerPiece,
      cbm: p.soldOut
        ? ((p.negotiationQuantity || 0) / p.quantity) * p.cbm
        : ((parseInt(p.negotiationQuantity) || 0) / p.quantity) * p.cbm || p.cbm,
    }));

  return (
    <div>
      <Header />
      <div dir={currentDir} className="min-h-screen bg-white pt-40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          {/* Header */}
          <div className="bg-[#EEF4FF] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">
              {t("seller.allSellerProducts")} {sellerId || "x"}
            </h1>
            <Link
              to={ROUTES.HOME}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              aria-label={t("seller.close")}
            >
              <X className="h-5 w-5 text-slate-600" />
            </Link>
          </div>

          {/* Products List */}
          <div className="space-y-6 mb-8">
            {productData.map((product, index) => {
              const totalQty = product.soldOut
                ? product.negotiationQuantity
                : parseInt(product.negotiationQuantity) || 0;
              const totalCbmForProduct = product.soldOut
                ? ((product.negotiationQuantity || 0) / product.quantity) * product.cbm
                : ((parseInt(product.negotiationQuantity) || 0) / product.quantity) * product.cbm || 0;
              const totalPriceForProduct = product.soldOut
                ? (product.negotiationQuantity || 0) * (product.negotiationPrice || 0)
                : (parseInt(product.negotiationQuantity) || 0) * (parseFloat(product.negotiationPrice) || product.pricePerPiece);

              return (
                <div
                  key={product.id}
                  className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                >
                  {/* Sold Out Overlay */}
                  {product.soldOut && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                      <div className="bg-red-600 text-white px-8 py-4 rounded-lg text-2xl font-bold">
                        {t("sellerProducts.soldOut")}
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
                      />
                      <div className="flex gap-2">
                        {product.thumbnails.map((thumb, idx) => (
                          <img
                            key={idx}
                            src={thumb}
                            alt={`${product.title} ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border border-slate-200"
                          />
                        ))}
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
                          <div className="text-slate-500 mb-1">{t("sellerProducts.quantity")}</div>
                          <div className="font-semibold text-slate-900">
                            {product.quantity.toLocaleString()}
                            <span className="text-xs font-normal text-slate-500">
                              {" "}
                              ({product.piecesPerCarton} {t("sellerProducts.piecesInCarton")})
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.pricePerPiece")}</div>
                          <div className="font-semibold text-slate-900">
                            {product.pricePerPiece.toLocaleString()} {i18n.language === 'ar' ? 'ر.س' : 'SAR'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.cbm")}</div>
                          <div className="font-semibold text-slate-900">
                            {product.cbm} CBM
                          </div>
                        </div>
                      </div>

                      {/* Negotiation Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-700 mb-2">
                            {t("sellerProducts.negotiationPrice")}
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
                              placeholder={t("sellerProducts.enterPrice")}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-slate-700 mb-2">
                            {t("sellerProducts.negotiationQuantity")}
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
                              placeholder={t("sellerProducts.enterQuantity")}
                            />
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalQuantity")}</div>
                          <div className="font-semibold text-slate-900">
                            {totalQty.toLocaleString()} {t("sellerProducts.piece")}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalCbm")}</div>
                          <div className="font-semibold text-slate-900">
                            {totalCbmForProduct.toFixed(2)} CBM
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("sellerProducts.totalPrice")}</div>
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
            })}
          </div>

          {/* Order Summary Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{t("sellerProducts.orderSummary")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {t("sellerProducts.serial")}
                    </th>
                    <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {t("sellerProducts.itemNumber")}
                    </th>
                    <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {t("sellerProducts.quantity")}
                    </th>
                    <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {t("sellerProducts.price")}
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
                      {t("sellerProducts.total")}
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
              {t("sellerProducts.siteFee")}
            </p>
          </div>

          {/* Notes and Submit */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("sellerProducts.addNote")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={t("sellerProducts.enterNotes")}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                alert(i18n.language === 'ar' ? "تم إرسال طلب التفاوض بنجاح!" : "Negotiation request sent successfully!");
                navigate(ROUTES.ORDER_CHECKOUT);
              }}
              className="w-full bg-[#F5AF00] hover:bg-[#E5A000] text-[#194386] font-bold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              {t("sellerProducts.sendNegotiationRequest")}
            </button>
          </div>
        </div>
      </div>
      <FooterArabic />
    </div>
  );
}

