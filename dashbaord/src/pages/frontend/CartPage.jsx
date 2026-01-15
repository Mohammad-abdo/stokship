import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { frontendApi } from "@/lib/frontendApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { showToast } from "@/lib/toast";

const CartPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [updating, setUpdating] = useState(false);

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
      setCart(res.data?.data || res.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      showToast.error("Error", "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setUpdating(true);
      await frontendApi.updateCartItem(itemId, { quantity: newQuantity });
      await fetchCart();
    } catch (error) {
      showToast.error("Error", "Failed to update quantity");
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdating(true);
      await frontendApi.removeFromCart(itemId);
      await fetchCart();
      showToast.success("Success", language === "ar" ? "تم الحذف" : "Item removed");
    } catch (error) {
      showToast.error("Error", "Failed to remove item");
    } finally {
      setUpdating(false);
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

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = cart?.shipping || 0;
  const total = cart?.total || subtotal + shipping;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {language === "ar" ? "سلة التسوق" : "Shopping Cart"}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {language === "ar" ? "السلة فارغة" : "Your cart is empty"}
            </h2>
            <p className="text-gray-600 mb-6">
              {language === "ar" ? "ابدأ التسوق لإضافة منتجات" : "Start shopping to add products"}
            </p>
            <Link
              to="/frontend/products"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-3 rounded-lg transition-colors"
            >
              {language === "ar" ? "تسوق الآن" : "Shop Now"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                const displayName =
                  language === "ar" ? product?.nameAr || product?.nameEn : product?.nameEn || product?.nameAr;
                const imageUrl = product?.imgUrl || product?.images?.[0]?.url || "";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4"
                  >
                    {/* Product Image */}
                    <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {language === "ar" ? "لا توجد صورة" : "No Image"}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow">
                      <Link
                        to={`/frontend/products/${product?.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2"
                      >
                        {displayName}
                      </Link>
                      <p className="text-gray-600 mb-4">
                        {item.price} {language === "ar" ? "ر.س" : "SAR"} × {item.quantity} ={" "}
                        {item.price * item.quantity} {language === "ar" ? "ر.س" : "SAR"}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating || item.quantity <= 1}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1 border border-gray-300 rounded min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {language === "ar" ? "ملخص الطلب" : "Order Summary"}
                </h2>
                <div className="space-y-3 mb-6">
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
                <Link
                  to="/frontend/checkout"
                  className="block w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-3 rounded-lg text-center transition-colors"
                >
                  {language === "ar" ? "إتمام الطلب" : "Proceed to Checkout"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;

