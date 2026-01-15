import React from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductsListComponent from '../components/ProductsListComponent'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'

export default function ProductsListPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const categorySlug = searchParams.get('category');
  const search = searchParams.get('q') || searchParams.get('search');

  return (
    <div>
      <Header/>
      <ProductsListComponent categoryId={categoryId} categorySlug={categorySlug} search={search}/>
      <FooterArabic/>
    </div>
  )
}
