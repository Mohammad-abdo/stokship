import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { frontendApi } from "@/lib/frontendApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard, Truck, MapPin } from "lucide-react";
import { showToast } from "@/lib/toast";

const CheckoutPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState(null);
  const [checkoutData, setCheckoutData] = useState({
    shippingAddress: "",
    paymentMethod: "BANK_CARD",
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/frontend/login");
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await frontendApi.getCart();
      const cartData = res.data?.data || res.data;
      setCart(cartData);
      
      if (!cartData?.items || cartData.items.length === 0) {
        showToast.error("Error", language === "ar" ? "السلة فارغة" : "Cart is empty");
        navigate("/frontend/cart");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      showToast.error("Error", "Failed to load cart");
      navigate("/frontend/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Initialize checkout
      const checkoutRes = await frontendApi.initCheckout({
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: checkoutData.shippingAddress,
        paymentMethod: checkoutData.paymentMethod,
        notes: checkoutData.notes,
      });

      const sessionId = checkoutRes.data?.data?.sessionId || checkoutRes.data?.sessionId;
      
      // Complete checkout
      const completeRes = await frontendApi.completeCheckout({
        sessionId,
      });

      showToast.success("Success", language === "ar" ? "تم إتمام الطلب بنجاح" : "Order placed successfully");
      navigate(`/frontend/orders/${completeRes.data?.data?.orderId || completeRes.data?.orderId}`);
    } catch (error) {
      console.error("Error completing checkout:", error);
      showToast.error("Error", error.response?.data?.message || "Failed to complete checkout");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  const subtotal = cart.subtotal || 0;
  const shipping = cart.shipping || 0;
  const total = cart.total || subtotal + shipping;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {language === "ar" ? "إتمام الطلب" : "Checkout"}
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {language === "ar" ? "عنوان الشحن" : "Shipping Address"}
                </h2>
              </div>
              <textarea
                value={checkoutData.shippingAddress}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, shippingAddress: e.target.value })
                }
                required
                rows={4}
                placeholder={
                  language === "ar"
                    ? "أدخل عنوان الشحن الكامل"
                    : "Enter full shipping address"
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {language === "ar" ? "طريقة الدفع" : "Payment Method"}
                </h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_CARD"
                    checked={checkoutData.paymentMethod === "BANK_CARD"}
                    onChange={(e) =>
                      setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-semibold">
                    {language === "ar" ? "بطاقة بنكية" : "Bank Card"}
                  </span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={checkoutData.paymentMethod === "BANK_TRANSFER"}
                    onChange={(e) =>
                      setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-semibold">
                    {language === "ar" ? "تحويل بنكي" : "Bank Transfer"}
                  </span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="WALLET"
                    checked={checkoutData.paymentMethod === "WALLET"}
                    onChange={(e) =>
                      setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-semibold">
                    {language === "ar" ? "محفظة" : "Wallet"}
                  </span>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {language === "ar" ? "ملاحظات الطلب" : "Order Notes"}
                </h2>
              </div>
              <textarea
                value={checkoutData.notes}
                onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                rows={4}
                placeholder={
                  language === "ar"
                    ? "أضف أي ملاحظات خاصة بالطلب (اختياري)"
                    : "Add any special notes for your order (optional)"
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {language === "ar" ? "ملخص الطلب" : "Order Summary"}
              </h2>
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => {
                  const product = item.product;
                  const displayName =
                    language === "ar"
                      ? product?.nameAr || product?.nameEn
                      : product?.nameEn || product?.nameAr;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{displayName} × {item.quantity}</span>
                      <span className="text-gray-900 font-semibold">
                        {item.price * item.quantity} {language === "ar" ? "ر.س" : "SAR"}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span>
                      {subtotal} {language === "ar" ? "ر.س" : "SAR"}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{language === "ar" ? "الشحن" : "Shipping"}</span>
                    <span>
                      {shipping} {language === "ar" ? "ر.س" : "SAR"}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
                    <span>
                      {total} {language === "ar" ? "ر.س" : "SAR"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{language === "ar" ? "جاري المعالجة..." : "Processing..."}</span>
                  </>
                ) : (
                  <span>{language === "ar" ? "تأكيد الطلب" : "Confirm Order"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;

