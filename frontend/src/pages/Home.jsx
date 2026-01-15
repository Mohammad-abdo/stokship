import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Banner from '../components/Banner'
import Header from '../components/Header'
import FeaturedCategories from '../components/FeaturedCategories'
import ProductsList from '../components/ProductsList'
import RecommendedProducts from '../components/RecommendedProducts'
import NewArrivalsBannerWithSwiper from '../components/NewArrivalsBannerWithSwiper'
import CtaBanner from '../components/CtaBanner'
import PopularGoodsChips from '../components/PopularGoodsChips'
import FooterArabic from '../components/FooterArabic'
import { ROUTES } from '../routes'

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const titles = [t("categories.smartphones"), t("categories.clothing")];
  
  const handleCategorySelect = (category) => {
    // Navigate to products list with category filter
    navigate(`${ROUTES.PRODUCTS_LIST}?category=${encodeURIComponent(category)}`);
  };
  
  return (
    <div>
      <Header/>
      <Banner/>
      <FeaturedCategories/>
      <ProductsList title={titles[0]} limit={8}/>
      <ProductsList title={titles[1]} limit={8}/>
       <NewArrivalsBannerWithSwiper/>
      <RecommendedProducts/>
      <CtaBanner/>
      <PopularGoodsChips onSelect={handleCategorySelect}/>
      <FooterArabic/>
     
    </div>
  )
}
