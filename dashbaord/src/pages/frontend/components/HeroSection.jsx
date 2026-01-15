import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const HeroSection = () => {
  const { language } = useLanguage();

  const heroContent = {
    ar: {
      title: "اكتشف أحدث المنتجات",
      subtitle: "منصة B2B للتجارة الإلكترونية توفر أفضل المنتجات والخدمات للشركات",
      cta: "تسوق الآن",
    },
    en: {
      title: "Discover the Latest Products",
      subtitle: "B2B E-commerce platform providing the best products and services for businesses",
      cta: "Shop Now",
    },
  };

  const content = heroContent[language] || heroContent.en;

  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {content.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            {content.subtitle}
          </p>
          <Link
            to="/frontend/products"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-4 rounded-lg text-lg transition-colors shadow-lg"
          >
            {content.cta}
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

