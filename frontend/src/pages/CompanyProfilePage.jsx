import React from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'
import ProductsList from '../components/ProductsList'
import RecommendedProducts from '../components/RecommendedProducts'
import CompanyAdsComponent from '../components/CompanyAdsComponent'
import Orders from '../components/Orders'
export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const title = t("products.mostPurchased");
  return (
    <div>
      <Header/>
      <CompanyAdsComponent/>
      <RecommendedProducts/>
      <ProductsList title={title}/>
      <FooterArabic/>
    </div>
  )
}
