import React from 'react'
import { useTranslation } from 'react-i18next'
import ProductsList from '../components/ProductsList'
import RecommendedProducts from '../components/RecommendedProducts'
import CompanyAdsComponent from '../components/CompanyAdsComponent'
import { MainLayout } from '../components/Layout'

export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const title = t("products.mostPurchased");
  return (
    <MainLayout>
      <CompanyAdsComponent/>
      <RecommendedProducts/>
      <ProductsList title={title}/>
    </MainLayout>
  )
}
