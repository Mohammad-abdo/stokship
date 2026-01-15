import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { frontendApi } from "@/lib/frontendApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart, Heart, Share2, Star, Loader2, ArrowLeft } from "lucide-react";
import { showToast } from "@/lib/toast";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const [productRes, relatedRes] = await Promise.all([
        frontendApi.getProduct(id),
        frontendApi.getRelatedProducts(id),
      ]);

      setProduct(productRes.data?.data || productRes.data);
      setRelatedProducts(relatedRes.data?.data || relatedRes.data || []);
      if (productRes.data?.data?.images?.length > 0) {
        setSelectedImage(0);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      showToast.error("Error", "Failed to load product");
      navigate("/frontend");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/frontend/login");
      return;
    }

    try {
      await frontendApi.addToCart({
        productId: product.id,
        quantity,
      });
      showToast.success("Success", language === "ar" ? "تمت الإضافة للسلة" : "Added to cart");
    } catch (error) {
      showToast.error("Error", error.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      navigate("/frontend/login");
      return;
    }

    try {
      // TODO: Get user's default wishlist or create one
      // await frontendApi.addToWishlist(wishlistId, product.id);
      setIsFavorite(!isFavorite);
      showToast.success("Success", language === "ar" ? "تمت الإضافة للمفضلة" : "Added to wishlist");
    } catch (error) {
      showToast.error("Error", "Failed to add to wishlist");
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

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === "ar" ? "المنتج غير موجود" : "Product not found"}
          </h1>
          <Link to="/frontend" className="text-blue-600 hover:underline">
            {language === "ar" ? "العودة للصفحة الرئيسية" : "Back to homepage"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = language === "ar" ? product.nameAr || product.nameEn : product.nameEn || product.nameAr;
  const displayDescription =
    language === "ar" ? product.descriptionAr || product.descriptionEn : product.descriptionEn || product.descriptionAr;
  const images = product.images || (product.imgUrl ? [{ url: product.imgUrl }] : []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{language === "ar" ? "العودة" : "Back"}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url || images[selectedImage]}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {language === "ar" ? "لا توجد صورة" : "No Image"}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-blue-600" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img.url || img}
                      alt={`${displayName} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{displayName}</h1>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-blue-600">
                {product.price || product.minPrice || "0.00"}
              </span>
              <span className="text-lg text-gray-500 ml-2">
                {language === "ar" ? "ر.س" : "SAR"}
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === "ar" ? "الوصف" : "Description"}
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{displayDescription || "N/A"}</p>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 mb-2">
                {language === "ar" ? "الكمية" : "Quantity"}
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{language === "ar" ? "أضف للسلة" : "Add to Cart"}</span>
              </button>
              <button
                onClick={handleAddToWishlist}
                className={`px-6 py-4 border-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isFavorite
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500" : ""}`} />
                <span>{language === "ar" ? "مفضلة" : "Wishlist"}</span>
              </button>
              <button className="px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {language === "ar" ? "تفاصيل المنتج" : "Product Details"}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {product.category && (
                  <div>
                    <span className="font-semibold">
                      {language === "ar" ? "التصنيف: " : "Category: "}
                    </span>
                    {language === "ar" ? product.category.nameAr || product.category.nameEn : product.category.nameEn || product.category.nameAr}
                  </div>
                )}
                {product.vendor && (
                  <div>
                    <span className="font-semibold">
                      {language === "ar" ? "البائع: " : "Vendor: "}
                    </span>
                    {product.vendor.companyName || product.vendor.businessName}
                  </div>
                )}
                {product.sku && (
                  <div>
                    <span className="font-semibold">SKU: </span>
                    {product.sku}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {language === "ar" ? "منتجات ذات صلة" : "Related Products"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;

