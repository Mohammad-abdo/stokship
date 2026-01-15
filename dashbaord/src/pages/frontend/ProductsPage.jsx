import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { frontendApi } from "@/lib/frontendApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Filter, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";

const ProductsPage = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryId = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  const sortBy = searchParams.get("sort") || "date";
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryId, searchQuery, sortBy, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        sort: sortBy,
        status: "AVAILABLE",
      };

      if (categoryId) {
        const res = await frontendApi.getCategoryProducts(categoryId, params);
        const data = res.data?.data || res.data || {};
        setProducts(data.products || data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 12));
      } else if (searchQuery) {
        const res = await frontendApi.searchProducts(searchQuery, params);
        const data = res.data?.data || res.data || {};
        setProducts(data.products || data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 12));
      } else {
        const res = await frontendApi.getProducts(params);
        const data = res.data?.data || res.data || {};
        setProducts(data.products || data || []);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 12));
      }
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await frontendApi.getCategories();
      setCategories(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSortChange = (newSort) => {
    setSearchParams({ ...Object.fromEntries(searchParams), sort: newSort, page: "1" });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery
              ? `${language === "ar" ? "نتائج البحث عن" : "Search results for"}: "${searchQuery}"`
              : categoryId
              ? categories.find((c) => c.id === parseInt(categoryId))?.nameEn || "Products"
              : language === "ar"
              ? "جميع المنتجات"
              : "All Products"}
          </h1>
          <p className="text-gray-600">
            {products.length} {language === "ar" ? "منتج" : "products"} {searchQuery && `found`}
          </p>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span>{language === "ar" ? "تصفية" : "Filters"}</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">
                {language === "ar" ? "الأحدث" : "Newest"}
              </option>
              <option value="price_asc">
                {language === "ar" ? "السعر: منخفض إلى عالي" : "Price: Low to High"}
              </option>
              <option value="price_desc">
                {language === "ar" ? "السعر: عالي إلى منخفض" : "Price: High to Low"}
              </option>
              <option value="rating">
                {language === "ar" ? "الأعلى تقييماً" : "Highest Rated"}
              </option>
              <option value="popularity">
                {language === "ar" ? "الأكثر شعبية" : "Most Popular"}
              </option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Sidebar */}
        {filtersOpen && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">{language === "ar" ? "التصنيفات" : "Categories"}</h3>
            <div className="space-y-2">
              <Link
                to="/frontend/products"
                className={`block px-4 py-2 rounded-lg ${
                  !categoryId ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"
                }`}
              >
                {language === "ar" ? "الكل" : "All"}
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/frontend/products?category=${category.id}`}
                  className={`block px-4 py-2 rounded-lg ${
                    categoryId === category.id.toString()
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {language === "ar" ? category.nameAr || category.nameEn : category.nameEn || category.nameAr}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {language === "ar" ? "لا توجد منتجات" : "No products found"}
            </p>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 border rounded-lg ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum}>...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;

