import React from 'react'
import OrderCheckoutComponent from '../components/OrderCheckoutComponent'
import Header from '../components/Header'
import FooterArabic from '../components/FooterArabic'
import CheckoutSummaryComponent from '../components/CheckoutSummaryComponent'

export default function OrderCheckout() {
  return (
    <div>
      <Header/>
      <OrderCheckoutComponent/>
      <FooterArabic/>
    </div>
  )
}
